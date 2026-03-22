from typing import AsyncGenerator

from openai import AsyncOpenAI

from services.prompts import WONGBOT_SYSTEM_PROMPT


class OpenAIService:
    def __init__(self, api_key: str, model: str, context: str) -> None:
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model
        self._system_instruction = WONGBOT_SYSTEM_PROMPT.format(context=context)

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        openai_messages = [{"role": "system", "content": self._system_instruction}]
        for msg in history:
            # Gemini uses "model", OpenAI uses "assistant"
            role = "assistant" if msg["role"] == "model" else "user"
            openai_messages.append({"role": role, "content": msg["content"]})
        openai_messages.append({"role": "user", "content": message})

        stream = await self._client.chat.completions.create(
            model=self._model,
            messages=openai_messages,
            stream=True,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
