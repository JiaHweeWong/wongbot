from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LiteLLM model string.
    # Use provider/model format, e.g. "gemini/gemini-3-flash-preview", "openai/gpt-4o".
    llm_model: str = "gemini/gemini-3-flash-preview"
    content_dir: str = "../frontend/content"
    rate_limit_per_day: int = Field(default=10, ge=1)
    global_rate_limit_per_day: int = Field(default=100, ge=1)
    max_response_tokens: int = Field(default=700, ge=1)
    max_summary_tokens: int = Field(default=300, ge=1)
    max_tool_rounds: int = Field(default=4, ge=0)
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
