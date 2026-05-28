"""API endpoint tests using the fake classifier from conftest."""
from __future__ import annotations


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["model"] == "fake-bert"
    assert body["device"] == "cpu"


def test_predict_returns_label_and_probabilities(client):
    r = client.post("/predict", json={"statement": "The earth is flat."})
    assert r.status_code == 200

    body = r.json()
    assert body["label"] == "fake"
    assert 0 <= body["confidence"] <= 1
    assert set(body["probabilities"].keys()) == {"fake", "truth"}
    # Probabilities should sum to roughly 1.
    assert abs(sum(body["probabilities"].values()) - 1.0) < 1e-6
    assert "latency_ms" in body


def test_explain_returns_per_token_scores(client):
    r = client.post("/explain", json={"statement": "The earth is flat."})
    assert r.status_code == 200

    body = r.json()
    assert body["label"] == "fake"
    assert len(body["attributions"]) > 0
    for attr in body["attributions"]:
        assert isinstance(attr["token"], str)
        assert isinstance(attr["score"], float)


def test_predict_rejects_empty_statement(client):
    r = client.post("/predict", json={"statement": ""})
    assert r.status_code == 422
    assert r.json()["error"] == "validation_error"


def test_predict_rejects_whitespace_only(client):
    r = client.post("/predict", json={"statement": "     "})
    assert r.status_code == 422


def test_predict_rejects_too_long(client):
    r = client.post("/predict", json={"statement": "x" * 5000})
    assert r.status_code == 422


def test_predict_strips_surrounding_whitespace(client):
    # Should accept — after stripping it's a real statement.
    r = client.post("/predict", json={"statement": "  The earth is flat.  "})
    assert r.status_code == 200


def test_predict_missing_field(client):
    r = client.post("/predict", json={})
    assert r.status_code == 422


def test_openapi_docs_available(client):
    r = client.get("/docs")
    assert r.status_code == 200
    r = client.get("/openapi.json")
    assert r.status_code == 200
