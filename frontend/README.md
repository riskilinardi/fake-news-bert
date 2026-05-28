# Frontend (Next.js)

The web UI for the classifier. You paste a statement, hit classify, and get back a verdict with a confidence score and, if you want it, the individual words that pushed the model one way or the other.

## Stack

Next.js 14 (App Router), React 18, TypeScript, and Tailwind for styling. It's a single page, so I didn't pull in a state library or a component kit. Plain `useState` and a handful of small components were enough and kept things easy to follow.

## Running it locally

```bash
cd frontend
npm install
npm run dev
```

You'll also need a `.env.local` with the API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then open http://localhost:3000. The backend has to be running too, otherwise the requests have nowhere to go. See `../backend/README.md` for that.

## Configuration

| Variable              | What it does                    |
| --------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend |

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import it on Vercel and set the root directory to `frontend/`.
3. Add `NEXT_PUBLIC_API_URL` in the project settings, pointing at your Hugging Face Space URL.
4. Add that same Vercel URL to the backend's `ALLOWED_ORIGINS` so CORS lets it through.

## Notes

The result card works with both label formats: the `LABEL_0` / `LABEL_1` you get from base BERT, and the real `truth` / `fake` from the fine-tuned model. That made it easy to build the UI before the trained model was ready.

BERT's tokenizer splits some words into pieces (things like `##ing` or `##ed`). The token-highlight component stitches those back together so the display shows whole words instead of fragments.
