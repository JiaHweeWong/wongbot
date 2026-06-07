from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LiteLLM model string.
    # Use provider/model format, e.g. "gemini/gemini-3-flash-preview", "openai/gpt-4o".
    llm_model: str = "gemini/gemini-3-flash-preview"
    content_dir: str = "../content"
    rate_limit_per_day: int = 10
    allowed_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
