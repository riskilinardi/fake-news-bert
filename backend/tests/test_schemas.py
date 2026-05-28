"""Schema validation tests"""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas import PredictRequest


def test_accepts_normal_statement():
    req = PredictRequest(statement="The earth is flat.")
    assert req.statement == "The earth is flat."


def test_strips_whitespace():
    req = PredictRequest(statement="  hello world  ")
    assert req.statement == "hello world"


def test_rejects_empty():
    with pytest.raises(ValidationError):
        PredictRequest(statement="")


def test_rejects_whitespace_only():
    with pytest.raises(ValidationError):
        PredictRequest(statement="    ")


def test_rejects_too_short():
    with pytest.raises(ValidationError):
        PredictRequest(statement="hi")


def test_rejects_too_long():
    with pytest.raises(ValidationError):
        PredictRequest(statement="x" * 5000)
