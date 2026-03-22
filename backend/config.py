from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_provider: str = "gemini"  # "gemini" or "openai"
    llm_model: str = "gemini-2.5-flash"
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    content_dir: str = "../content"
    rate_limit_per_day: int = 10
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
