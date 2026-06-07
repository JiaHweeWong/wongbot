import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from services.agent import AgentService
from services.content import ContentService


class AsyncStream:
    def __init__(self, chunks: list[dict[str, Any]]) -> None:
        self._chunks = chunks

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        for chunk in self._chunks:
            yield chunk


class FakeCompletion:
    def __init__(self, responses: list[Any]) -> None:
        self.responses = responses
        self.calls: list[dict[str, Any]] = []

    async def __call__(self, **kwargs):
        self.calls.append(kwargs)
        return self.responses.pop(0)


def stream_chunk(
    *,
    content: str | None = None,
    tool_calls: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "choices": [
            {
                "delta": {
                    "content": content,
                    "tool_calls": tool_calls or [],
                }
            }
        ]
    }


class AgentServiceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.temporary_directory = TemporaryDirectory()
        content_dir = Path(self.temporary_directory.name)
        (content_dir / "posts").mkdir()
        (content_dir / "skills").mkdir()
        (content_dir / "posts" / "hello-world.mdx").write_text(
            "---\ntitle: Hello World\ndate: 2026-01-01\n---\nPost body."
        )
        (content_dir / "skills" / "about.md").write_text("About Jia Hwee.")
        self.content_service = ContentService(str(content_dir))

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    async def test_streams_text_without_summarizing_empty_history(self) -> None:
        completion = FakeCompletion([AsyncStream([stream_chunk(content="Hello")])])
        service = self._service(completion)

        events = [event async for event in service.stream_response("Hi", [])]

        self.assertEqual(
            events,
            [
                {
                    "type": "summary",
                    "content": "",
                    "summarizedMessageCount": 0,
                },
                {"type": "text", "content": "Hello"},
            ],
        )
        self.assertEqual(len(completion.calls), 1)
        self.assertTrue(completion.calls[0]["stream"])
        self.assertEqual(completion.calls[0]["max_tokens"], 700)

    async def test_keeps_pending_aged_out_messages_until_summary_batch_is_full(self) -> None:
        history = [{"role": "user", "content": f"Message {index}"} for index in range(14)]
        completion = FakeCompletion([AsyncStream([stream_chunk(content="Noted.")])])
        service = self._service(completion)

        events = [event async for event in service.stream_response("Continue", history)]

        self.assertEqual(
            events,
            [
                {
                    "type": "summary",
                    "content": "",
                    "summarizedMessageCount": 0,
                },
                {"type": "text", "content": "Noted."},
            ],
        )
        self.assertEqual(len(completion.calls), 1)
        self.assertTrue(completion.calls[0]["stream"])
        primary_messages = completion.calls[0]["messages"]
        self.assertEqual(len(primary_messages), 16)
        self.assertEqual(primary_messages[1]["content"], "Message 0")
        self.assertEqual(primary_messages[-2]["content"], "Message 13")

    async def test_starts_summarizing_after_five_messages_age_out(self) -> None:
        history = [{"role": "user", "content": f"Message {index}"} for index in range(15)]
        completion = FakeCompletion(
            [
                {"choices": [{"message": {"content": "Initial summary."}}]},
                AsyncStream([stream_chunk(content="Response")]),
            ]
        )
        service = self._service(completion)

        events = [event async for event in service.stream_response("Continue", history)]

        self.assertEqual(
            events[0],
            {
                "type": "summary",
                "content": "Initial summary.",
                "summarizedMessageCount": 5,
            },
        )
        summary_messages = completion.calls[0]["messages"]
        self.assertEqual(len(summary_messages), 7)
        self.assertEqual(summary_messages[2]["content"], "Message 0")
        self.assertEqual(summary_messages[-1]["content"], "Message 4")
        self.assertEqual(completion.calls[0]["max_tokens"], 300)
        self.assertEqual(completion.calls[1]["max_tokens"], 700)

    async def test_primary_call_includes_latest_ten_and_pending_messages(self) -> None:
        history = [
            {
                "role": "user" if index % 2 == 0 else "model",
                "content": f"Message {index}",
            }
            for index in range(24)
        ]
        completion = FakeCompletion(
            [
                {"choices": [{"message": {"content": "Complete history summary."}}]},
                AsyncStream([stream_chunk(content="Response")]),
            ]
        )
        service = self._service(completion)

        events = [
            event
            async for event in service.stream_response(
                "Latest message",
                history,
                "Existing conversation summary.",
                0,
            )
        ]

        self.assertEqual(
            events,
            [
                {
                    "type": "summary",
                    "content": "Complete history summary.",
                    "summarizedMessageCount": 10,
                },
                {"type": "text", "content": "Response"},
            ],
        )
        summary_messages = completion.calls[0]["messages"]
        self.assertEqual(len(summary_messages), 12)
        self.assertIn("Existing conversation summary.", summary_messages[1]["content"])
        self.assertEqual(summary_messages[2]["content"], "Message 0")
        self.assertEqual(summary_messages[-1]["content"], "Message 9")

        primary_messages = completion.calls[1]["messages"]
        self.assertEqual(len(primary_messages), 16)
        self.assertEqual(primary_messages[1]["content"], "Message 10")
        self.assertEqual(primary_messages[-2]["content"], "Message 23")
        self.assertEqual(primary_messages[-1]["content"], "Latest message")

    async def test_only_summarizes_messages_not_covered_by_existing_summary(self) -> None:
        history = [{"role": "user", "content": f"Message {index}"} for index in range(31)]
        completion = FakeCompletion(
            [
                {"choices": [{"message": {"content": "Updated summary."}}]},
                AsyncStream([stream_chunk(content="Response")]),
            ]
        )
        service = self._service(completion)

        events = [
            event
            async for event in service.stream_response(
                "Latest message",
                history,
                "Messages zero through fourteen are covered.",
                15,
            )
        ]

        self.assertEqual(events[0]["summarizedMessageCount"], 20)
        summary_messages = completion.calls[0]["messages"]
        self.assertEqual(len(summary_messages), 7)
        self.assertEqual(summary_messages[2]["content"], "Message 15")
        self.assertEqual(summary_messages[-1]["content"], "Message 19")

        primary_messages = completion.calls[1]["messages"]
        self.assertEqual(primary_messages[1]["content"], "Message 20")
        self.assertEqual(primary_messages[-2]["content"], "Message 30")

    async def test_executes_streamed_tool_call_then_resumes_model(self) -> None:
        completion = FakeCompletion(
            [
                AsyncStream(
                    [
                        stream_chunk(
                            tool_calls=[
                                {
                                    "index": 0,
                                    "id": "call-1",
                                    "function": {
                                        "name": "read_",
                                        "arguments": '{"slug":"hello',
                                    },
                                }
                            ]
                        ),
                        stream_chunk(
                            tool_calls=[
                                {
                                    "index": 0,
                                    "function": {
                                        "name": "blog_post",
                                        "arguments": '-world"}',
                                    },
                                }
                            ]
                        ),
                    ]
                ),
                AsyncStream([stream_chunk(content="Here is the post.")]),
            ]
        )
        service = self._service(completion)

        events = [event async for event in service.stream_response("Read it", [])]

        self.assertEqual(
            events[0],
            {
                "type": "summary",
                "content": "",
                "summarizedMessageCount": 0,
            },
        )
        self.assertEqual(events[1]["type"], "tool_call")
        self.assertEqual(events[1]["name"], "read_blog_post")
        self.assertEqual(events[1]["input"], {"slug": "hello-world"})
        self.assertEqual(events[2]["type"], "tool_result")
        self.assertEqual(events[2]["output"]["title"], "Hello World")
        self.assertEqual(events[3], {"type": "text", "content": "Here is the post."})

        follow_up_messages = completion.calls[1]["messages"]
        tool_message = follow_up_messages[-1]
        self.assertEqual(tool_message["role"], "tool")
        self.assertEqual(json.loads(tool_message["content"])["slug"], "hello-world")

    async def test_rejects_invalid_tool_arguments(self) -> None:
        completion = FakeCompletion(
            [
                AsyncStream(
                    [
                        stream_chunk(
                            tool_calls=[
                                {
                                    "index": 0,
                                    "id": "call-1",
                                    "function": {
                                        "name": "read_blog_post",
                                        "arguments": "not-json",
                                    },
                                }
                            ]
                        )
                    ]
                )
            ]
        )
        service = self._service(completion)

        with self.assertRaisesRegex(ValueError, "invalid tool arguments"):
            [event async for event in service.stream_response("Read it", [])]

    def _service(self, completion: FakeCompletion) -> AgentService:
        return AgentService(
            model="test/model",
            context="Test context",
            content_service=self.content_service,
            completion=completion,
        )


if __name__ == "__main__":
    unittest.main()
