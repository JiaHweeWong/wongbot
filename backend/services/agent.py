import json
from collections.abc import AsyncGenerator, Awaitable, Callable
from typing import Any

import litellm

from services.content import ContentService
from services.llm_base import ChatStreamEvent
from services.prompts import SUMMARY_SYSTEM_PROMPT, TOOL_USE_GUIDANCE, WONGBOT_SYSTEM_PROMPT

Completion = Callable[..., Awaitable[Any]]
RECENT_MESSAGE_LIMIT = 10
SUMMARY_BATCH_SIZE = 5

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_blog_posts",
            "description": (
                "List all blog posts with their slugs, titles, dates, and previews. "
                "Call this when the user asks about blog posts or what Jia Hwee has written."
            ),
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_blog_post",
            "description": (
                "Read the full content of a specific blog post by its slug. "
                "Call this after listing posts to get full details."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "The slug of the blog post to read",
                    }
                },
                "required": ["slug"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_skills",
            "description": (
                "List Jia Hwee's skill documents with their slugs, titles, and previews. "
                "Call this for skills, experience, projects, achievements, or profile details."
            ),
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_skill",
            "description": (
                "Read the full content of a skill document by its slug when precise skill, "
                "project, achievement, or profile details are needed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "The slug of the skill document to read",
                    }
                },
                "required": ["slug"],
                "additionalProperties": False,
            },
        },
    },
]


class AgentService:
    def __init__(
        self,
        model: str,
        context: str,
        content_service: ContentService,
        max_tool_rounds: int = 4,
        max_response_tokens: int = 700,
        max_summary_tokens: int = 300,
        completion: Completion = litellm.acompletion,
    ) -> None:
        self._model = model
        self._base_system_prompt = WONGBOT_SYSTEM_PROMPT.format(context=context)
        self._content_service = content_service
        self._max_tool_rounds = max_tool_rounds
        self._max_response_tokens = max_response_tokens
        self._max_summary_tokens = max_summary_tokens
        self._completion = completion

    async def stream_response(
        self,
        message: str,
        history: list[dict],
        summary: str = "",
        summarized_message_count: int = 0,
    ) -> AsyncGenerator[ChatStreamEvent, None]:
        normalized_history = [self._normalize_message(item) for item in history]
        aged_out_message_count = max(0, len(normalized_history) - RECENT_MESSAGE_LIMIT)
        covered_message_count = min(summarized_message_count, aged_out_message_count)
        if not summary:
            covered_message_count = 0

        unsummarized_message_count = aged_out_message_count - covered_message_count
        summary_batch_count = unsummarized_message_count // SUMMARY_BATCH_SIZE
        messages_to_summarize_count = summary_batch_count * SUMMARY_BATCH_SIZE
        summary_end = covered_message_count + messages_to_summarize_count
        messages_to_summarize: list[dict] = []
        if messages_to_summarize_count:
            messages_to_summarize = normalized_history[covered_message_count:summary_end]

        updated_summary = await self._summarize(summary, messages_to_summarize)
        updated_message_count = covered_message_count + len(messages_to_summarize)
        pending_messages = normalized_history[updated_message_count:aged_out_message_count]
        recent_messages = normalized_history[-RECENT_MESSAGE_LIMIT:]
        yield {
            "type": "summary",
            "content": updated_summary,
            "summarizedMessageCount": updated_message_count,
        }
        system_prompt = (
            f"{self._base_system_prompt}\n\n"
            f"Conversation summary:\n"
            f"{updated_summary or 'No prior conversation summary.'}\n\n"
            f"Last user message:\n{message}\n\n"
            f"{TOOL_USE_GUIDANCE}"
        )
        messages = [
            {"role": "system", "content": system_prompt},
            *pending_messages,
            *recent_messages,
            {"role": "user", "content": message},
        ]

        for _round in range(self._max_tool_rounds + 1):
            tool_calls: dict[int, dict[str, Any]] = {}
            response = await self._completion(
                model=self._model,
                messages=messages,
                tools=TOOLS,
                temperature=0.4,
                max_tokens=self._max_response_tokens,
                stream=True,
            )

            async for chunk in response:
                delta = self._first_delta(chunk)
                content = self._value(delta, "content")
                if content:
                    yield {"type": "text", "content": str(content)}
                self._collect_tool_calls(tool_calls, self._value(delta, "tool_calls", []))

            if not tool_calls:
                return
            if _round == self._max_tool_rounds:
                raise RuntimeError("Agent exceeded the maximum number of tool rounds")

            assistant_tool_calls = [tool_calls[index] for index in sorted(tool_calls)]
            messages.append(
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": assistant_tool_calls,
                }
            )

            for tool_call in assistant_tool_calls:
                name = tool_call["function"]["name"]
                arguments = self._parse_arguments(tool_call["function"]["arguments"])
                yield {
                    "type": "tool_call",
                    "id": tool_call["id"],
                    "name": name,
                    "input": arguments,
                }
                output = self._execute_tool(name, arguments)
                yield {
                    "type": "tool_result",
                    "id": tool_call["id"],
                    "name": name,
                    "output": output,
                }
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": name,
                        "content": json.dumps(output),
                    }
                )

    async def _summarize(self, summary: str, messages: list[dict]) -> str:
        if not messages:
            return summary

        response = await self._completion(
            model=self._model,
            messages=[
                {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Existing summary:\n"
                        f"{summary or 'No prior conversation summary.'}\n\n"
                        "New messages to incorporate follow."
                    ),
                },
                *messages,
            ],
            temperature=0.4,
            max_tokens=self._max_summary_tokens,
            stream=False,
        )
        content = self._value(self._first_message(response), "content")
        return str(content or "No prior conversation history.")

    def _execute_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        if name == "list_blog_posts":
            return self._content_service.list_posts()
        if name == "read_blog_post":
            post = self._content_service.get_post(str(arguments.get("slug", "")))
            return post if post is not None else {"error": "Post not found"}
        if name == "list_skills":
            return self._content_service.list_skills()
        if name == "read_skill":
            skill = self._content_service.get_skill(str(arguments.get("slug", "")))
            return skill if skill is not None else {"error": "Skill document not found"}
        return {"error": f"Unknown tool: {name}"}

    @classmethod
    def _collect_tool_calls(cls, collected: dict[int, dict[str, Any]], calls: Any) -> None:
        for fallback_index, call in enumerate(calls or []):
            index = int(cls._value(call, "index", fallback_index))
            current = collected.setdefault(
                index,
                {
                    "id": "",
                    "type": "function",
                    "function": {"name": "", "arguments": ""},
                },
            )
            call_id = cls._value(call, "id")
            if call_id:
                current["id"] = str(call_id)

            function = cls._value(call, "function", {})
            name = cls._value(function, "name")
            arguments = cls._value(function, "arguments")
            if name:
                current["function"]["name"] += str(name)
            if arguments:
                current["function"]["arguments"] += str(arguments)

    @staticmethod
    def _parse_arguments(raw_arguments: str) -> dict[str, Any]:
        if not raw_arguments:
            return {}
        try:
            arguments = json.loads(raw_arguments)
        except json.JSONDecodeError as error:
            raise ValueError("Model returned invalid tool arguments") from error
        if not isinstance(arguments, dict):
            raise ValueError("Model tool arguments must be a JSON object")
        return arguments

    @classmethod
    def _first_delta(cls, chunk: Any) -> Any:
        choices = cls._value(chunk, "choices", [])
        return cls._value(choices[0], "delta", {}) if choices else {}

    @classmethod
    def _first_message(cls, response: Any) -> Any:
        choices = cls._value(response, "choices", [])
        return cls._value(choices[0], "message", {}) if choices else {}

    @staticmethod
    def _normalize_message(message: dict) -> dict[str, str]:
        role = "assistant" if message["role"] == "model" else "user"
        return {"role": role, "content": str(message["content"])}

    @staticmethod
    def _value(value: Any, key: str, default: Any = None) -> Any:
        if isinstance(value, dict):
            return value.get(key, default)
        return getattr(value, key, default)
