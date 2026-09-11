import { fold, normalizeInvoiceDate, parseMoney } from "./invoice-parse.ts";

export type ZKind = "z" | "pos";

export type ZDraft = {
  kind: ZKind;
  cash: number | null;
  card: number | null;
  total: number | null;
  receipts: number | null;
  date: string;
};

export function emptyZ(kind: ZKind = "z"): ZDraft {
  return { kind, cash: null, card: null, total: null, receipts: null, date: "" };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function asAmt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseMoney(String(v));
  if (n == null || !Number.isFinite(n) || n < 0) return null;
  return round2(n);
}

const AMOUNT_RE = /\d{1,3}(?:[.,]\d{3})+[.,]\d{2}|\d+[.,]\d{2}/g;

function isDateFragment(src: string, start: number, token: string) {
  const after = src.slice(start + token.length);
  const before = src.slice(Math.max(0, start - 2), start);
  if (/^[./-]\d/.test(after)) return true;
  if (/\d[./-]$/.test(before)) return true;
  return false;
}

function amountsIn(s: string): number[] {
  const out: number[] = [];
  const re = new RegExp(AMOUNT_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (isDateFragment(s, m.index, m[0])) continue;
    const n = parseMoney(m[0]);
    if (n != null && n >= 0 && n < 1_000_000) out.push(n);
  }
  return out;
}

function lastAmount(s: string): number | null {
  const all = amountsIn(s);
  return all.length ? all[all.length - 1] : null;
}

function intIn(s: string): number | null {
  if (lastAmount(s) != null) return null;
  if (/^\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s*$/.test(s)) return null;
  const m = s.match(/(?:^|[^\d])(\d{1,5})(?:[^\d.,]|$)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function amountAfter(hay: string, label: RegExp): number | null {
  const re = new RegExp(
    `(?:${label.source})[\\wα-ω]*\\s*[:.\\-]*\\s*(\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2}|\\d+[.,]\\d{2})`,
    "gi",
  );
  let last: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(hay))) {
    if (isDateFragment(hay, m.index + m[0].length - m[1].length, m[1])) continue;
    const n = parseMoney(m[1]);
    if (n != null && n >= 0) last = n;
  }
  return last;
}

function intAfter(hay: string, label: RegExp): number | null {
  const re = new RegExp(
    `(?:${label.source})[\\wα-ω]*\\s*[:.\\-]*\\s*(\\d{1,5})(?![\\d./-])`,
    "gi",
  );
  let last: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(hay))) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 0) last = n;
  }
  return last;
}

type LineKind = "cash" | "card" | "total" | "receipts" | "net" | "skip";

function classifyLine(folded: string): LineKind | null {
  if (!folded) return null;
  if (/(αρχικ|συρταρ|float|opening|κερματ|ρεστα\b)/.test(folded)) return "skip";
  if (/(φπα|φ π α|\bvat\b)/.test(folded) && !/γενικο\s*συνολο|grand/.test(folded)) {
    return "skip";
  }
  if (/(καθαρο\s*(?:συνολο|ποσο)?|\bnet\s*amount\b|\bnet\b)/.test(folded) && !/μικτο|gross/.test(folded)) {
    return "net";
  }
  if (/αποδειξ|receipts?|συναλλαγ|synallag|transactions?|πραξεις|apodeix|πληθος/.test(folded)) {
    return "receipts";
  }
  if (/μετρητ|metrita|metrhta|\bcash\b/.test(folded)) return "cash";
  if (
    /καρτ|kartes|karta|\bcard\b|credit|debit|πιστωτικ|χρεωστικ|electronic|\beft\b|\bpos\b/.test(
      folded,
    )
  ) {
    return "card";
  }
  if (
    /γενικο\s*συνολο|grand\s*total|συνολο\s*(?:ημερας|παρτιδας|πωλησεων)|synola|μικτο|gross|συνολο\s*καρτων|batch\s*total/.test(
      folded,
    )
  ) {
    return "total";
  }
  if (/συνολο/.test(folded)) return "total";
  return null;
}

function parseLines(raw: string) {
  const lines = raw.replace(/\u00a0/g, " ").split(/\r?\n/);
  const folded = lines.map((l) => fold(l));
  let cash: number | null = null;
  let card: number | null = null;
  let total: number | null = null;
  let net: number | null = null;
  let receipts: number | null = null;

  const nextUseful = (i: number) => {
    for (let j = i + 1; j < lines.length; j += 1) {
      if (!folded[j]) continue;
      return j;
    }
    return -1;
  };

  const amountAt = (i: number): number | null => {
    const same = lastAmount(lines[i] ?? "");
    if (same != null) return same;
    const j = nextUseful(i);
    if (j < 0) return null;
    const nextKind = classifyLine(folded[j]);
    if (nextKind && nextKind !== "skip") return null;
    if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test((lines[j] ?? "").trim())) return null;
    return lastAmount(lines[j] ?? "");
  };

  for (let i = 0; i < lines.length; i += 1) {
    const kind = classifyLine(folded[i]);
    if (!kind || kind === "skip") continue;
    if (kind === "receipts") {
      const n = intIn(lines[i] ?? "") ?? (() => {
        const j = nextUseful(i);
        if (j < 0) return null;
        if (classifyLine(folded[j])) return null;
        return intIn(lines[j] ?? "");
      })();
      if (n != null) receipts = n;
      continue;
    }
    const amt = amountAt(i);
    if (amt == null) continue;
    if (kind === "cash") cash = amt;
    else if (kind === "card") card = amt;
    else if (kind === "total") total = amt;
    else if (kind === "net") net = amt;
  }

  return { cash, card, total, net, receipts };
}

export function draftFromZModel(parsed: Record<string, unknown>, fallback: ZKind): ZDraft {
  const kind = parsed.kind === "pos" || parsed.kind === "z" ? parsed.kind : fallback;
  const receiptsRaw = parsed.receipts ?? parsed.count;
  return {
    kind,
    cash: asAmt(parsed.cash),
    card: asAmt(parsed.card ?? parsed.pos ?? parsed.pos_card),
    total: asAmt(parsed.total),
    receipts: asAmt(receiptsRaw) != null ? Math.round(Number(receiptsRaw)) : null,
    date: normalizeInvoiceDate(String(parsed.date ?? "")),
  };
}

export function mergeZDrafts(ai: ZDraft, heuristic: ZDraft): ZDraft {
  const cash = ai.cash ?? heuristic.cash;
  const card = ai.card ?? heuristic.card;
  const total = ai.total ?? heuristic.total;
  return {
    kind: ai.kind || heuristic.kind,
    cash,
    card,
    total: total ?? (cash != null && card != null ? round2(cash + card) : null),
    receipts: ai.receipts ?? heuristic.receipts,
    date: ai.date || heuristic.date,
  };
}

export function parseZText(raw: string, kind: ZKind): ZDraft {
  const text = raw.replace(/\u00a0/g, " ");
  const hay = fold(text);
  const dateMatch = raw.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(\d{4}-\d{2}-\d{2})/);
  const looksPos =
    kind === "pos" ||
    /παρτιδ|settlement|batch|viva|cardlink|worldline|nexi|mypos|edps/.test(hay);

  const lined = parseLines(text);
  const cash = lined.cash ?? amountAfter(hay, /μετρητ|metrita|metrhta|cash/);
  const card =
    lined.card ??
    amountAfter(hay, /καρτ|kartes|karta|card|credit|πιστωτικ|χρεωστικ|pos|electronic/);
  const total =
    lined.total ??
    amountAfter(
      hay,
      /γενικο\s*συνολο|grand\s*total|συνολο\s*(?:ημερας|παρτιδας|πωλησεων)|synola|batch\s*total|συνολο\s*καρτων|μικτο|gross/,
    );
  const receipts =
    lined.receipts ??
    intAfter(hay, /αποδειξ|receipts?|συναλλαγ|synallag|transactions?|πραξεις|apodeix|πληθος/);

  if (looksPos) {
    const posTotal = card ?? total ?? lined.net;
    return {
      kind: "pos",
      cash: null,
      card: posTotal,
      total: posTotal,
      receipts,
      date: dateMatch ? normalizeInvoiceDate(dateMatch[0]) : "",
    };
  }

  return {
    kind: "z",
    cash,
    card,
    total: total ?? (cash != null && card != null ? round2(cash + card) : null),
    receipts,
    date: dateMatch ? normalizeInvoiceDate(dateMatch[0]) : "",
  };
}
