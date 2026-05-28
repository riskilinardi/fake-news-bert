interface Props {
  label: string;
  probability: number;
  color: "red" | "emerald" | "slate";
}

const colorClasses: Record<Props["color"], string> = {
  red: "bg-red-500",
  emerald: "bg-emerald-500",
  slate: "bg-slate-400",
};

export function ProbabilityBar({ label, probability, color }: Props) {
  const pct = (probability * 100).toFixed(1);

  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-slate-700 mb-1.5">
        <span className="capitalize">{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
