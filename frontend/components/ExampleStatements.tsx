interface Props {
  onPick: (statement: string) => void;
  disabled?: boolean;
}

// Picked to span the difficulty range: a clearly verifiable claim, an
// empirically false one, and an ambiguous policy claim where even humans
// disagree. Avoided naming real political figures.
const EXAMPLES = [
  "The unemployment rate is at its lowest point in fifty years.",
  "Drinking bleach is a safe and effective treatment for viral infections.",
  "Crime rates in major cities have doubled over the past decade.",
];

export function ExampleStatements({ onPick, disabled }: Props) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
        Try an example
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            disabled={disabled}
            onClick={() => onPick(example)}
            className="text-left text-sm text-slate-700 bg-white border border-slate-200 rounded-md px-3 py-1.5 hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
