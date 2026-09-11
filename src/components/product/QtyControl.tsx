import { Minus, Plus } from "lucide-react";

export function QtyControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full border border-line"
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Λιγότερο"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-lg tabular-nums">{value}</span>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full border border-line"
        onClick={() => onChange(value + 1)}
        aria-label="Περισσότερο"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
