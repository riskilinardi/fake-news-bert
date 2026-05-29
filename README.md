# Fake News Classifier

A fake-news classifier built on a fine-tuned BERT model, with a FastAPI backend and a Next.js frontend. You paste a statement, and it returns a verdict (truth or fake), a confidence score, and the words that pushed the model toward its decision.

**Live demo:** https://fakenewsbert-rl.vercel.app/
**API:** https://riskilinardi-fakenewsbert.hf.space ([docs](https://riskilinardi-fakenewsbert.hf.space/docs))
**Model:** https://huggingface.co/riskilinardi/bert-politifact

## What this is

This started as a coursework project comparing a few classical NLP approaches on fake-news detection. I extended it into a deployed product: a fine-tuned BERT model behind a real API, with a web UI that shows not just the prediction but which tokens drove it.

The honest headline is that the model gets about 69% accuracy, and that number is part of the point rather than something to hide. More on why below.

## The dataset

I used the [PolitiFact fact-check dataset](https://www.kaggle.com/datasets/rmisra/politifact-fact-check-dataset), around 21,000 statements that PolitiFact has rated. The original ratings come in six levels (true, mostly-true, half-true, mostly-false, false, pants-fire), which I collapsed into a binary truth-vs-fake label. Every model uses the same 80/20 stratified split with a fixed seed, so the comparison between them is fair.

## Models and results

I trained and compared five variants, all on the same test set:

| Model | Input | Accuracy | Macro F1 |
|-------|-------|----------|----------|
| Naive Bayes + CountVectorizer | statement | 0.678 | 0.677 |
| TF-IDF + Logistic Regression | statement | 0.679 | 0.673 |
| BiLSTM + Word2Vec | statement | 0.683 | 0.682 |
| BERT (fine-tuned) | statement | 0.693 | 0.692 |
| BERT + metadata | statement + speaker + source | 0.709 | 0.707 |

(The three classical and BiLSTM models come from the earlier version of this project. Their results are reported here for comparison; the notebooks in `research/` cover the two BERT variants.)

The thing I found interesting: every model that only sees the bare statement lands within a point of each other, around 68%, whether it's a simple bag-of-words classifier or a 110-million-parameter transformer. That plateau says the limit is in the data, not the model. A single PolitiFact statement often isn't verifiable from the text alone. "The unemployment rate is the lowest in fifty years" isn't true or false because of how it's worded; it depends on facts the sentence doesn't carry.

When I add the speaker and the source channel to the input, BERT goes up to about 71%. That small lift is the actual result: the missing piece was context, not a bigger model. I kept both BERT variants because the comparison is the point.

The deployed demo serves the text-only BERT model, since that matches what a user actually types in (a bare statement, no speaker or source fields).

## Architecture

Two services that deploy independently:

```
  Browser
     |
     v
  Next.js frontend  (Vercel)
     |
     |  HTTP
     v
  FastAPI backend   (Docker on Hugging Face Spaces)
     |
     v
  BERT model        (loaded from Hugging Face Hub at startup)
```

- The backend exposes `/predict`, `/explain`, and `/health`. It loads the model once at startup and reuses it, which is the difference between fast responses and unusable ones.
- The frontend is a single page that calls the API and renders the verdict, the probability bars, and the token highlights.

## Explainability

The `/explain` endpoint returns a contribution score for each token, which the frontend renders as highlighted words. I used integrated gradients (via `transformers-interpret`) rather than the model's attention weights. Attention gets used for this a lot, but there's solid work showing it isn't a reliable explanation of why a classifier decided something (Jain and Wallace, "Attention is not Explanation", 2019). Integrated gradients hold up better.

## Repo layout

```
.
├── backend/      FastAPI service, Dockerfile, tests
├── frontend/     Next.js app
└── research/     the two BERT training notebooks
```

Each of `backend/` and `frontend/` has its own README with setup and deployment steps.

## Stack

Python, PyTorch, Hugging Face Transformers, FastAPI, pytest on the backend. Next.js, React, TypeScript, Tailwind on the frontend. Docker for the container, Hugging Face Spaces and Vercel for hosting.

## Notes and limitations

This is a portfolio project, not a fact-checking tool you should rely on. The model reflects whatever is in the PolitiFact data, biases included, and 69% accuracy means it is wrong fairly often. It is meant to show the engineering and the analysis, not to settle whether a claim is actually true.
