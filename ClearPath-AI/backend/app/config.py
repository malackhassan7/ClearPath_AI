"""
Application configuration using pydantic-settings.
All settings are read from environment variables or .env file.
"""
from __future__ import annotations

import json
import logging
import secrets
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[1]


_PLACEHOLDER_SECRETS = {
    "change-this-secret-key-minimum-32-chars-long",
    "replace-with-a-random-secret-at-least-32-characters",
    "changeme",
    "secret",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        hide_input_in_errors=True,
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql+asyncpg://dairysetu:change-this-local-password@localhost:5432/dairysetu_tn"
    )
    SYNC_DATABASE_URL: str = ""

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-secret-key-minimum-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── LLM providers ─────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_PROVIDER: str = "groq"  # 'groq' | 'gemini'

    # ── Application ───────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_NAME: str = "CLEARPATH AI"
    DEMO_MODE: bool = True
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:3000"]

    # ── External APIs ─────────────────────────────────────────────────────────
    DATA_GOV_API_KEY: str = ""

    # ── Validators ────────────────────────────────────────────────────────────
    @model_validator(mode="after")
    def _validate_database_urls(self):
        try:
            async_url = make_url(self.DATABASE_URL)
            sync_url = make_url(self.SYNC_DATABASE_URL) if self.SYNC_DATABASE_URL else async_url.set(drivername="postgresql+psycopg2")
            if async_url.drivername != "postgresql+asyncpg" or sync_url.drivername not in ("postgresql", "postgresql+psycopg2"):
                raise ValueError()
            if not async_url.host or not async_url.database:
                raise ValueError()
            fields = ("host", "port", "database", "username", "password")
            if any(getattr(async_url, f) != getattr(sync_url, f) for f in fields):
                raise ValueError()
        except Exception:
            raise ValueError("DATABASE_URL must use postgresql+asyncpg; SYNC_DATABASE_URL must target the same PostgreSQL database and credentials.") from None
        self.SYNC_DATABASE_URL = sync_url.render_as_string(hide_password=False)
        return self

    @model_validator(mode="after")
    def _require_real_jwt_secret(self):
        """Refuse a placeholder secret outside development; use a random one in development."""
        weak = self.JWT_SECRET_KEY.strip().lower() in _PLACEHOLDER_SECRETS or len(self.JWT_SECRET_KEY) < 32
        if not weak:
            return self
        if self.APP_ENV.lower() in ("development", "dev", "test", "testing"):
            logging.getLogger("dairysetu").warning(
                "JWT_SECRET_KEY is missing or a placeholder. Using a random secret for this run; "
                "sign-ins end when the server restarts. Set JWT_SECRET_KEY in backend/.env to keep them."
            )
            self.JWT_SECRET_KEY = secrets.token_urlsafe(48)
            return self
        raise ValueError("JWT_SECRET_KEY must be a random value of at least 32 characters when APP_ENV is not development.")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()


settings = get_settings()
