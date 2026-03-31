from typing import AsyncGenerator, Protocol


class LLMService(Protocol):
    async def stream_response(
        self,
        message: str,
        history: list[dict],
    ) -> AsyncGenerator[str, None]: ...
