# Fake News Classifier

Paste in a statement and it tells you whether it looks true or fake, how sure it is, and which words pushed it that way. Under the hood, it's a fine-tuned BERT model behind a FastAPI backend, with a Next.js frontend.

**Live demo:** https://fakenewsbert-rl.vercel.app/
**API:** https://riskilinardi-fakenewsbert.hf.space ([docs](https://riskilinardi-fakenewsbert.hf.space/docs))
**Model:** https://huggingface.co/riskilinardi/bert-politifact

> The API runs on a free Hugging Face Space that naps when nobody's used it for a while, so the first request after a quiet spell can be slow. After that, it's quick.

## What this is

This started as a coursework project comparing a few classical NLP approaches to fake-news detection. I took it further and turned it into a deployed product: a fine-tuned BERT model behind a real API, with a web UI that shows not just the prediction but which words drove it.

The honest headline is that the model gets about 69% accuracy, and that number is part of the point rather than something to hide. More on why below.

## The dataset

I used the [PolitiFact fact-check dataset](https://www.kaggle.com/datasets/rmisra/politifact-fact-check-dataset), just over 21,000 statements that PolitiFact has rated. The ratings come in six levels (true, mostly-true, half-true, mostly-false, false, pants-fire), which I collapsed into two labels: the top three count as truth and the bottom three as fake. Every model uses the same 80/20 stratified split with a fixed seed, so they're all scored on the same 4,231 test statements and the comparison between them is fair.

## Models and results

I trained and compared five variants, all on the same test set:

| Model | Input | Accuracy | Macro F1 |
|-------|-------|----------|----------|
| Naive Bayes + CountVectorizer | statement | 0.678 | 0.677 |
| TF-IDF + Logistic Regression | statement | 0.679 | 0.673 |
| BiLSTM + Word2Vec | statement | 0.683 | 0.682 |
| BERT (fine-tuned) | statement | 0.688 | 0.686 |
| BERT + metadata | statement + speaker + source | 0.709 | 0.707 |

For a sense of scale, always guessing "fake" gets 55.6%, because it's the bigger class.

(The Naive Bayes, logistic regression and BiLSTM results come from the coursework this project grew out of, so their code isn't in this repo. The notebooks in `research/` cover the two BERT variants.)

A couple of caveats from the coursework, since I'd rather you hear them from me. I picked the BiLSTM's decision threshold by looking at the test set, which flatters it. At the default threshold it gets 0.657, so treat its row as a best case. The Naive Bayes and logistic regression runs also built part of their features from the full dataset before splitting, which is a smaller leak and likely moves them much less. Neither changes the story below.

The thing I found interesting: Naive Bayes, logistic regression and BERT all land within about a point of each other, around 68%, and the BiLSTM sits a couple of points under them once you take away its lucky threshold. A simple bag-of-words classifier and a 110-million-parameter transformer end up almost level. That plateau says the limit is in the data, not the model. A single PolitiFact statement often isn't verifiable from the text alone. "The unemployment rate is the lowest in fifty years" isn't true or false because of how it's worded; it depends on facts the sentence doesn't carry.

When I fold the speaker and the source into the input, BERT goes up to about 71%. That small lift is the actual result: the missing piece was context, not a bigger model. I kept both BERT variants because the comparison is the point.

The live demo serves the text-only BERT model, since that matches what you actually type in: a bare statement, with no speaker or source.

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

## The boring but important bits

- **Rate limits.** `/predict` allows 30 requests a minute and `/explain` allows 10, keyed on the client's address, using slowapi. `/explain` runs a gradient pass, so it gets the tighter limit.
- **Input checks.** Statements are trimmed and have to be 5 to 1,000 characters. Anything else gets a clear 422 back, in the same shape every time, instead of a stack trace. The model itself reads the first 128 tokens, the same length it was trained on, so the tail of a very long statement gets cut off.
- **Tests.** 15 tests run against a fake classifier, so they're fast and never download BERT. Two integration tests load the real model and only run when you ask for them (`RUN_INTEGRATION=1`).
- **Logging.** Every request is logged with its path, status and how long it took, and each prediction sends back its own latency.

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

Python, PyTorch, Hugging Face Transformers, transformers-interpret, FastAPI, slowapi and pytest on the backend. Next.js, React, TypeScript and Tailwind on the frontend. Docker for the container, Hugging Face Spaces and Vercel for hosting.

## Notes and limitations

This is a portfolio project, not a fact-checking tool you should rely on. The model reflects whatever is in the PolitiFact data, biases included, and at 69% accuracy it's wrong fairly often. It's here to show the engineering and the analysis, not to settle whether a claim is actually true.

---

Built by Riski Linardi. [Portfolio](https://riskilinardi.dev) · [GitHub](https://github.com/riskilinardi)
