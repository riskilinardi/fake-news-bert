import type { ExplainResponse, PredictResponse } from "@/lib/types";
import { isExplainResponse } from "@/lib/types";
import { ProbabilityBar } from "./ProbabilityBar";
import { TokenHighlights } from "./TokenHighlights";

interface Props {
  result: PredictResponse | ExplainResponse;
}

function badgeColors(label: string): { bg: string; text: string; ring: string } {
  if (label === "fake") {
    return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" };
  }
  if (label === "truth") {
    return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" };
  }
  // Fallback for the bert-base-uncased boot-up state (LABEL_0/LABEL_1).
  return { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200" };
}

function barColor(label: string): "red" | "emerald" | "slate" {
  if (label === "fake") return "red";
  if (label === "truth") return "emerald";
  return "slate";
}

export function ResultCard({ result }: Props) {
  const colors = badgeColors(result.label);
  const confidencePct = (result.confidence * 100).toFixed(1);

  // Render probability bars in a stable order, predicted class first.
  const orderedLabels = Object.keys(result.probabilities).sort((a, b) => {
    if (a === result.label) return -1;
    if (b === result.label) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}
          >
            {result.label}
          </span>
          <span className="text-slate-600 text-sm">
            <span className="tabular-nums font-medium text-slate-900">{confidencePct}%</span>{" "}
            confidence
          </span>
        </div>
        <span className="text-xs text-slate-400 tabular-nums">
          {result.latency_ms.toFixed(0)} ms
        </span>
      </div>

      <div className="space-y-3">
        {orderedLabels.map((label) => (
          <ProbabilityBar
            key={label}
            label={label}
            probability={result.probabilities[label]}
            color={barColor(label)}
          />
        ))}
      </div>

      {isExplainResponse(result) && result.attributions.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Token attributions
          </p>
          <TokenHighlights
            attributions={result.attributions}
            predictedLabel={result.label}
          />
          <p className="mt-3 text-xs text-slate-500">
            Computed with integrated gradients. Stronger colour indicates a token
            that pushed the model toward its prediction.
          </p>
        </div>
      )}
    </div>
  );
}
