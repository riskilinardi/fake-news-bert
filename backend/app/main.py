"""FastAPI service for the fake-news classifier.

Endpoints:
    GET  /health   — readiness check (no rate limit)
    POST /predict  — label, confidence, per-class probabilities
    POST /explain  — predict() output plus per-token integrated-gradients scores
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .classifier import Classifier
from .config import settings
from .schemas import (
    ErrorResponse,
    ExplainResponse,
    HealthResponse,
    PredictRequest,
    PredictResponse,
    TokenAttribution,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the model on startup, reuse for every request.
    app.state.classifier = Classifier()
    yield
    # Nothing to clean up — torch handles it.


app = FastAPI(
    title="Fake News Classifier",
    description=(
        "BERT fine-tuned on PolitiFact for fake-news detection. "
        "See /docs for the interactive OpenAPI schema."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting per client IP. Behind a proxy (HF Spaces is), get_remote_address
# reads X-Forwarded-For correctly.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %d (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    # Surface the first validation error in a frontend-friendly shape.
    first = exc.errors()[0] if exc.errors() else {}
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="validation_error",
            detail=first.get("msg", "Invalid request"),
        ).model_dump(),
    )


@app.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    classifier: Classifier = request.app.state.classifier
    return HealthResponse(
        status="ok",
        model=classifier.model_name,
        device=classifier.device,
    )


@app.post("/predict", response_model=PredictResponse)
@limiter.limit(settings.rate_limit_predict)
def predict(request: Request, body: PredictRequest) -> PredictResponse:
    classifier: Classifier = request.app.state.classifier
    result = classifier.predict(body.statement)
    return PredictResponse(
        label=result.label,
        confidence=result.confidence,
        probabilities=result.probabilities,
        latency_ms=result.latency_ms,
    )


@app.post("/explain", response_model=ExplainResponse)
@limiter.limit(settings.rate_limit_explain)
def explain(request: Request, body: PredictRequest) -> ExplainResponse:
    classifier: Classifier = request.app.state.classifier
    result = classifier.explain(body.statement)
    return ExplainResponse(
        label=result.label,
        confidence=result.confidence,
        probabilities=result.probabilities,
        attributions=[
            TokenAttribution(token=t, score=s) for t, s in result.attributions
        ],
        latency_ms=result.latency_ms,
    )
