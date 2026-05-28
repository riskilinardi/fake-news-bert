interface Props {
  value: string;
  onChange: (v: string) => void;
  onClassify: () => void;
  onExplain: () => void;
  loading: boolean;
}

const MAX_CHARS = 1000;

export function StatementInput({
  value,
  onChange,
  onClassify,
  onExplain,
  loading,
}: Props) {
  const tooShort = value.trim().length < 5;
  const disabled = loading || tooShort;
  const remaining = MAX_CHARS - value.length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Paste a statement to classify…"
          rows={4}
          disabled={loading}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none disabled:bg-slate-50"
          aria-label="Statement to classify"
        />
        <div className="absolute bottom-2 right-3 text-xs text-slate-400 tabular-nums">
          {remaining}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onClassify}
          disabled={disabled}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Classifying…" : "Classify"}
        </button>
        <button
          type="button"
          onClick={onExplain}
          disabled={disabled}
          className="px-4 py-2 bg-white text-slate-900 text-sm font-medium rounded-lg border border-slate-300 hover:border-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Classify with explanation
        </button>
      </div>
    </div>
  );
}
