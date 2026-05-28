"""Integration test against the real model."""
from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION") != "1",
    reason="Set RUN_INTEGRATION=1 to run integration tests",
)


def test_real_classifier_predicts():
    from app.classifier import Classifier

    clf = Classifier()
    result = clf.predict("The earth is flat.")

    assert result.label in clf.id2label.values()
    assert 0 <= result.confidence <= 1
    assert abs(sum(result.probabilities.values()) - 1.0) < 1e-4
    assert result.latency_ms > 0


def test_real_classifier_explains():
    from app.classifier import Classifier

    clf = Classifier()
    result = clf.explain("The earth is flat.")

    assert len(result.attributions) > 0
    # Special tokens should be filtered out.
    tokens = [t for t, _ in result.attributions]
    assert "[CLS]" not in tokens
    assert "[SEP]" not in tokens
