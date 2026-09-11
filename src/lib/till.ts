import type { PayKind, TillSnapshot } from "@/lib/ledger";

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function expectedCash(input: {
  openFloat: number;
  cashSales: number;
  cashSpend: number;
  movesIn: number;
  movesOut: number;
}) {
  return round2(
    input.openFloat + input.cashSales + input.movesIn - input.cashSpend - input.movesOut,
  );
}

export const PAY_LABEL: Record<PayKind, string> = {
  cash: "Μετρητά",
  card: "Κάρτα",
  transfer: "Έμβασμα",
};

export const MOVE_REASONS_IN = ["Ρέστα / κέρματα", "Κατάθεση στο συρτάρι", "Διόρθωση"] as const;
export const MOVE_REASONS_OUT = ["Ανάληψη ιδιοκτήτη", "Ψιλά / ρέστα έξω", "Λάθος ταμείου"] as const;

export function euro(n: number) {
  return n.toFixed(2).replace(".", ",") + "€";
}

export function diffLabel(a: number | null) {
  if (a === null) return "—";
  if (Math.abs(a) < 0.005) return "Ταιριάζει";
  return a > 0 ? `+${euro(a)}` : euro(a);
}

export function tillStatus(t: TillSnapshot) {
  if (!t.session) return "Κλειστό";
  if (t.session.closed) return "Κλεισμένο";
  return "Ανοιχτό";
}

export type CheckRow = {
  key: "cash" | "card" | "pos";
  label: string;
  dose: number;
  report: number | null;
  diff: number | null;
};

export function checkRows(t: TillSnapshot): CheckRow[] {
  return [
    {
      key: "cash",
      label: "Z μετρητά",
      dose: t.cashSales,
      report: t.lastCheck?.zCash ?? null,
      diff: t.zCashDiff,
    },
    {
      key: "card",
      label: "Z κάρτες",
      dose: t.cardSales,
      report: t.lastCheck?.zCard ?? null,
      diff: t.zCardDiff,
    },
    {
      key: "pos",
      label: "Παρτίδα POS",
      dose: t.cardSales,
      report: t.lastCheck?.posCard ?? null,
      diff: t.posDiff,
    },
  ];
}
