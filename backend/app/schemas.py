"""Request and response schemas for the API."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from .config import settings


class PredictRequest(BaseModel):
    statement: str = Field(
        ...,
        description="The statement to fact-check.",
    )

    @field_validator("statement")
    @classmethod
    def _clean(cls, v: str) -> str:
        v = v.strip()
        if len(v) < settings.statement_min_chars:
            raise ValueError(
                f"statement must be at least {settings.statement_min_chars} characters"
            )
        if len(v) > settings.statement_max_chars:
            raise ValueError(
                f"statement must be at most {settings.statement_max_chars} characters"
            )
        return v


class PredictResponse(BaseModel):
    label: str
    confidence: float
    probabilities: dict[str, float]
    latency_ms: float


class TokenAttribution(BaseModel):
    token: str
    score: float


class ExplainResponse(BaseModel):
    label: str
    confidence: float
    probabilities: dict[str, float]
    attributions: list[TokenAttribution]
    latency_ms: float


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
