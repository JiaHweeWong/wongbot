from typing import AsyncGenerator

from google import genai
from google.genai import types

from services.prompts import WONGBOT_SYSTEM_PROMPT


class GeminiService:
    def __init__(self, api_key: str, model: str, context: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self._system_instruction = WONGBOT_SYSTEM_PROMPT.format(context=context)

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        gemini_history: list[types.Content] = [
            types.Content(
                role=msg["role"],
                parts=[types.Part(text=msg["content"])],
            )
            for msg in history
        ]

        async for chunk in await self._client.aio.models.generate_content_stream(
            model=self._model,
            contents=gemini_history
            + [types.Content(role="user", parts=[types.Part(text=message)])],
            config=types.GenerateContentConfig(
                system_instruction=self._system_instruction,
            ),
        ):
            if chunk.text:
                yield chunk.text
