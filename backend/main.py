from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers.blog import create_blog_router
from routers.chat import create_chat_router
from services.content import ContentService
from services.litellm_service import LiteLLMService
from services.rate_limiter import RateLimiter

app = FastAPI(title="Wongbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

content_service = ContentService(content_dir=settings.content_dir)
skill_context = content_service.load_skill_context()
llm_service = LiteLLMService(model=settings.llm_model, context=skill_context)
rate_limiter = RateLimiter(limit=settings.rate_limit_per_day)

app.include_router(create_chat_router(llm_service, rate_limiter))
app.include_router(create_blog_router(content_service))


@app.get("/health")
def health():
    return {"status": "ok"}
