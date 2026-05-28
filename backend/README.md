# Backend (FastAPI)

This is the API that serves the fake-news classifier. It loads a fine-tuned BERT model and exposes a few endpoints for predictions and explanations. Locally it runs with uvicorn; in production it runs as a Docker container on Hugging Face Spaces.

## Endpoints

| Method | Path       | Body                     | Returns                                             |
| ------ | ---------- | ------------------------ | --------------------------------------------------- |
| GET    | `/health`  | none                     | Model name, device, status                          |
| POST   | `/predict` | `{ "statement": "..." }` | Label, confidence, per-class probabilities, latency |
| POST   | `/explain` | `{ "statement": "..." }` | Same as predict, plus per-token attribution scores  |

There's an interactive API page at `/docs` once the server is running.

## Running it locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # on Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

Quick test once it's up:

```bash
curl -X POST http://localhost:8000/predict \
  -H "content-type: application/json" \
  -d '{"statement": "The earth is flat."}'
```

The first boot downloads the model (about 440 MB), so give it a minute. If you haven't pointed `MODEL_NAME` at the fine-tuned model yet, it falls back to plain `bert-base-uncased` and you'll get back `LABEL_0` / `LABEL_1` instead of `truth` / `fake`. That's normal, base BERT just hasn't been trained on this task.

## Tests

```bash
pytest                              # fast, uses a stub model
RUN_INTEGRATION=1 pytest tests/test_integration.py   # loads the real model
```

The normal test run swaps in a fake classifier so it doesn't have to download or load BERT, which keeps it quick. The integration test is opt-in because it actually pulls the model.

## Configuration

Everything configurable lives in `app/config.py`. You can override any of it with environment variables or a `.env` file (copy `.env.example` to `.env` to start).

| Variable             | Default                                       | What it does               |
| -------------------- | --------------------------------------------- | -------------------------- |
| `MODEL_NAME`         | `bert-base-uncased`                           | HF Hub id or local path    |
| `ALLOWED_ORIGINS`    | `http://localhost:3000,http://127.0.0.1:3000` | Allowed CORS origins       |
| `RATE_LIMIT_PREDICT` | `30/minute`                                   | Per-IP limit on `/predict` |
| `RATE_LIMIT_EXPLAIN` | `10/minute`                                   | Per-IP limit on `/explain` |

## A few design decisions worth explaining

For the explanations I used integrated gradients (via `transformers-interpret`) rather than the model's attention weights. Attention gets used a lot for this kind of thing, but it's not actually a reliable explanation of why a classifier decided something (Jain and Wallace have a well-known 2019 paper on exactly this, "Attention is not Explanation"). Integrated gradients give per-token scores that hold up better.

The model is loaded a single time when the server starts and reused for every request. I tried loading per-request early on and inference was painfully slow, so the startup-load approach is deliberate.

Rate limiting is per IP using slowapi. `/explain` runs a gradient pass so it's heavier than `/predict`, which is why it has a lower limit.

One thing that cost me some time: don't add `from __future__ import annotations` to `main.py`. On newer Pydantic it stops FastAPI from resolving the request-body models and the whole thing fails to start. The hints work fine without it on Python 3.11.

## Deploying to Hugging Face Spaces

1. Create a new Space and pick the Docker SDK (blank template).
2. Push the contents of `backend/` to the Space's git repo.
3. Under Settings, add two variables:
   - `MODEL_NAME`, set to your model id (mine is `riskilinardi/bert-politifact`)
   - `ALLOWED_ORIGINS`, set to your deployed frontend URL
4. The Space builds the Dockerfile and serves on port 7860. The public URL looks like `https://your-username-spacename.hf.space`.
