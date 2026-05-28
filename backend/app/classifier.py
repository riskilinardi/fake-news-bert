"""Wraps the fine-tuned BERT model."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from transformers_interpret import SequenceClassificationExplainer

from .config import settings

logger = logging.getLogger(__name__)


@dataclass
class Prediction:
    label: str
    confidence: float
    probabilities: dict[str, float]
    latency_ms: float


@dataclass
class Explanation(Prediction):
    attributions: list[tuple[str, float]]


class Classifier:
    """Thin wrapper around a HuggingFace sequence-classification model."""

    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or settings.model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        logger.info("Loading %s on %s", self.model_name, self.device)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()

        # The fine-tuned model's config carries id2label. The base BERT fallback
        # gives LABEL_0/LABEL_1 — fine for boot-up testing.
        self.id2label = self.model.config.id2label

        self._explainer = SequenceClassificationExplainer(self.model, self.tokenizer)
        logger.info("Loaded. Labels: %s", self.id2label)

    @torch.inference_mode()
    def predict(self, text: str) -> Prediction:
        start = time.perf_counter()

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=settings.max_input_length,
        ).to(self.device)

        logits = self.model(**inputs).logits[0]
        probs = torch.softmax(logits, dim=-1).cpu().tolist()

        probabilities = {self.id2label[i]: float(p) for i, p in enumerate(probs)}
        top_idx = int(torch.argmax(logits).item())

        return Prediction(
            label=self.id2label[top_idx],
            confidence=probs[top_idx],
            probabilities=probabilities,
            latency_ms=(time.perf_counter() - start) * 1000,
        )

    def explain(self, text: str) -> Explanation:
        start = time.perf_counter()

        # Strip BERT special tokens — they're not meaningful to the user.
        raw_attrs = self._explainer(text)
        attributions = [
            (tok, float(score))
            for tok, score in raw_attrs
            if tok not in {"[CLS]", "[SEP]", "[PAD]"}
        ]

        pred = self.predict(text)
        return Explanation(
            label=pred.label,
            confidence=pred.confidence,
            probabilities=pred.probabilities,
            attributions=attributions,
            latency_ms=(time.perf_counter() - start) * 1000,
        )
