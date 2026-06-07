from typing import AsyncGenerator

import litellm

from services.prompts import WONGBOT_SYSTEM_PROMPT


class LiteLLMService:
    def __init__(self, model: str, context: str) -> None:
        self._model = model
        self._system_message = {
            "role": "system",
            "content": WONGBOT_SYSTEM_PROMPT.format(context=context),
        }

    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        messages = [self._system_message]
        for msg in history:
            # Our history uses "model" (Gemini convention); LiteLLM uses OpenAI convention
            role = "assistant" if msg["role"] == "model" else "user"
            messages.append({"role": role, "content": msg["content"]})
        messages.append({"role": "user", "content": message})

        response = await litellm.acompletion(model=self._model, messages=messages, stream=True)
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield content
