from collections.abc import AsyncGenerator
from typing import Any, Protocol

ChatStreamEvent = dict[str, Any]


class LLMService(Protocol):
    async def stream_response(
        self,
        message: str,
        history: list[dict],
        summary: str = "",
        summarized_message_count: int = 0,
    ) -> AsyncGenerator[ChatStreamEvent, None]: ...
