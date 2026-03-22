from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings, settings
from routers.blog import create_blog_router
from routers.chat import create_chat_router
from services.content import ContentService
from services.gemini import GeminiService
from services.llm_base import LLMService
from services.openai_service import OpenAIService
from services.rate_limiter import RateLimiter


def create_llm_service(settings: Settings, context: str) -> LLMService:
    if settings.llm_provider == "gemini":
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        return GeminiService(
            api_key=settings.gemini_api_key, model=settings.llm_model, context=context
        )
    elif settings.llm_provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        return OpenAIService(
            api_key=settings.openai_api_key, model=settings.llm_model, context=context
        )
    else:
        raise ValueError(
            f"Unknown LLM_PROVIDER: {settings.llm_provider!r}. Use 'gemini' or 'openai'."
        )


app = FastAPI(title="Wongbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

content_service = ContentService(content_dir=settings.content_dir)
skill_context = content_service.load_skill_context()
llm_service = create_llm_service(settings, skill_context)
rate_limiter = RateLimiter(limit=settings.rate_limit_per_day)

app.include_router(create_chat_router(llm_service, rate_limiter))
app.include_router(create_blog_router(content_service))
