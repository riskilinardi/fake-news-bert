"""Application configuration. Centralizes environment variable handling"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Model — defaults to base BERT so the service boots before the fine-tuned
    # model is on the Hub. Override with MODEL_NAME=your-username/your-model.
    model_name: str = "bert-base-uncased"
    max_input_length: int = 128

    # CORS — comma-separated list of allowed origins.
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Rate limiting — per-IP limits applied to inference endpoints.
    rate_limit_predict: str = "30/minute"
    rate_limit_explain: str = "10/minute"

    # Request validation
    statement_min_chars: int = 5
    statement_max_chars: int = 1000

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
