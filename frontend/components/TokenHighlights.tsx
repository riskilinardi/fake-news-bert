import type { TokenAttribution } from "@/lib/types";

interface Props {
  attributions: TokenAttribution[];
  predictedLabel: string;
}

interface Chip {
  text: string;
  score: number;
}

/**
 * BERT's WordPiece tokenizer splits unknown words into pieces prefixed with `##`.
 */
function mergeWordPieces(attributions: TokenAttribution[]): Chip[] {
  const chips: Chip[] = [];
  for (const { token, score } of attributions) {
    if (token.startsWith("##") && chips.length > 0) {
      const last = chips[chips.length - 1];
      last.text += token.slice(2);
      if (Math.abs(score) > Math.abs(last.score)) {
        last.score = score;
      }
    } else {
      chips.push({ text: token, score });
    }
  }
  return chips;
}

export function TokenHighlights({ attributions, predictedLabel }: Props) {
  const chips = mergeWordPieces(attributions);
  const maxAbs = Math.max(...chips.map((c) => Math.abs(c.score)), 0.01);

  // The "positive" hue tracks the predicted class so high-scoring tokens read
  const positiveRgb =
    predictedLabel === "fake" ? "239, 68, 68" : "16, 185, 129";
  const negativeRgb = "148, 163, 184";

  return (
    <div className="flex flex-wrap gap-1.5 leading-loose">
      {chips.map((chip, i) => {
        const intensity = Math.abs(chip.score) / maxAbs;
        const rgb = chip.score >= 0 ? positiveRgb : negativeRgb;
        // Clamp the lower bound so even low-scoring tokens are visible.
        const alpha = Math.max(0.08, intensity * 0.55);
        return (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded-md text-sm font-mono text-slate-900 ring-1 ring-slate-200/60"
            style={{ backgroundColor: `rgba(${rgb}, ${alpha})` }}
            title={`score: ${chip.score.toFixed(3)}`}
          >
            {chip.text}
          </span>
        );
      })}
    </div>
  );
}
