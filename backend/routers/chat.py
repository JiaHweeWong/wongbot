import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from models import ChatRequest
from services.llm_base import LLMService
from services.rate_limiter import RateLimiter, get_client_ip


def create_chat_router(llm_service: LLMService, rate_limiter: RateLimiter) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.post("/chat")
    async def chat(request: Request, body: ChatRequest) -> StreamingResponse:
        ip = get_client_ip(request)
        rate_limiter.check(ip)

        history = [{"role": msg.role, "content": msg.content} for msg in body.history]

        async def generate():
            async for chunk in llm_service.stream_response(body.message, history):
                yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    return router
