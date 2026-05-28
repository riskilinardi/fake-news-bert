"""Shared test fixtures."""
from __future__ import annotations

from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient

from app.classifier import Explanation, Prediction


class FakeClassifier:
    model_name = "fake-bert"
    device = "cpu"

    def predict(self, text: str) -> Prediction:
        return Prediction(
            label="fake",
            confidence=0.87,
            probabilities={"fake": 0.87, "truth": 0.13},
            latency_ms=1.23,
        )

    def explain(self, text: str) -> Explanation:
        return Explanation(
            label="fake",
            confidence=0.87,
            probabilities={"fake": 0.87, "truth": 0.13},
            latency_ms=4.56,
            attributions=[("the", 0.01), ("earth", 0.42), ("is", 0.05), ("flat", 0.78)],
        )


@pytest.fixture
def client(monkeypatch) -> TestClient:
    from app import main

    @asynccontextmanager
    async def fake_lifespan(app):
        app.state.classifier = FakeClassifier()
        yield

    monkeypatch.setattr(main.app.router, "lifespan_context", fake_lifespan)

    with TestClient(main.app) as c:
        yield c
