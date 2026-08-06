from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env.local",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    VITE_SUPABASE_URL: str
    SUPABASE_SECRET_KEY: str
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
