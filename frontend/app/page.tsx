"use client";

import { useState } from "react";

import { ErrorAlert } from "@/components/ErrorAlert";
import { ExampleStatements } from "@/components/ExampleStatements";
import { ResultCard } from "@/components/ResultCard";
import { StatementInput } from "@/components/StatementInput";
import { ApiError, NetworkError, explain, predict } from "@/lib/api";
import type { ExplainResponse, PredictResponse } from "@/lib/types";

type Result = PredictResponse | ExplainResponse;

export default function Home() {
  const [statement, setStatement] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(withExplanation: boolean) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = withExplanation
        ? await explain(statement)
        : await predict(statement);
      setResult(data);
    } catch (e) {
      if (e instanceof ApiError || e instanceof NetworkError) {
        setError(e.message);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Fake News Classifier
          </h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            A BERT model fine-tuned on the PolitiFact fact-check dataset. Paste
            a statement and the model returns a verdict, confidence, and
            optionally the tokens that drove the decision.
          </p>
        </header>

        <section className="space-y-3">
          <StatementInput
            value={statement}
            onChange={setStatement}
            onClassify={() => run(false)}
            onExplain={() => run(true)}
            loading={loading}
          />
          <ExampleStatements onPick={setStatement} disabled={loading} />
        </section>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        )}

        {result && <ResultCard result={result} />}

        <details className="text-sm text-slate-600 group">
          <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900 select-none">
            About this model
          </summary>
          <div className="mt-3 space-y-3 leading-relaxed">
            <p>
              The classifier is{" "}
              <code className="text-xs px-1 py-0.5 rounded bg-slate-100">
                bert-base-uncased
              </code>{" "}
              fine-tuned for three epochs on roughly 21,000 statements from
              PolitiFact, with labels collapsed from six fact-check categories
              into a binary truth-versus-fake target. Training notebook,
              comparison against classical baselines, and the FastAPI service
              code are in the repository.
            </p>
            <p>
              Token attributions use integrated gradients via{" "}
              <code className="text-xs px-1 py-0.5 rounded bg-slate-100">
                transformers-interpret
              </code>
              . Raw attention weights are deliberately not used because they are
              not a reliable explanation signal for classification.
            </p>
            <p className="text-slate-500">
              This is a portfolio project. The model reflects the biases and
              limitations of its training data and is not a substitute for human
              fact-checking.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
