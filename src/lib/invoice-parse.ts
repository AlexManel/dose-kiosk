import type { ExpenseLine, InvoiceDraft } from "@/lib/ledger";

const SKIP_NAME =
  /συνολο|υποσυνολο|πληρωτεο|εκπτωση|φπα|φ\.π\.α|vat|total|subtotal|discount|μετρητα|καρτα|αντιγραφο|σελιδα|page|αφμ|α\.φ\.μ|τιμολογιο|αποδειξη|invoice|δελτιο|ημερομηνια|date|προμηθευτης|πελατης|καθαρη\s*αξια|γενικο|synola|συνολων|περιγραφη|ποσοτητα|τιμη\s*μοναδ|αξια\s*γραμμ|κωδικος|ειδος|μοναδα|συντελεστ/;

const HEADER_SKIP =
  /τιμολογιο|αποδειξη|δελτιο\s*αποστολ|invoice|παραστατικ|ααδε|mydata|σελιδα|page|αντιγραφο|ημερομηνια|αριθμ|αρ\.\s*τιμ|α\.φ\.μ|αφμ|δ\.?ο\.?υ|κου|πελατης|buyer|customer|παραληπτης|διευθυνση|address|τηλ|email|iban|τραπεζ|πληρωμη|ημ\/νια|timologio|copy/;

const MONTH: Record<string, string> = {
  ιανουαριου: "01",
  ιαν: "01",
  φεβρουαριου: "02",
  φεβ: "02",
  μαρτιου: "03",
  μαρ: "03",
  απριλιου: "04",
  απρ: "04",
  μαιου: "05",
  μαι: "05",
  ιουνιου: "06",
  ιουν: "06",
  ιουλιου: "07",
  ιουλ: "07",
  αυγουστου: "08",
  αυγ: "08",
  σεπτεμβριου: "09",
  σεπ: "09",
  οκτωβριου: "10",
  οκτ: "10",
  νοεμβριου: "11",
  νοε: "11",
  δεκεμβριου: "12",
  δεκ: "12",
};

export function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function skipName(s: string) {
  return SKIP_NAME.test(fold(s));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function near(a: number, b: number) {
  return Math.abs(a - b) <= Math.max(0.06, 0.02 * Math.max(Math.abs(a), Math.abs(b)));
}

export function parseMoney(raw: string): number | null {
  const s = raw.replace(/[€\s]/g, "").replace(/[^\d,.-]/g, "");
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s)) {
    return Number(s.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(s)) {
    return Number(s.replace(/,/g, ""));
  }
  if (/^\d+,\d{1,2}$/.test(s)) return Number(s.replace(",", "."));
  if (/^\d+\.\d{1,2}$/.test(s)) return Number(s);
  if (/^\d+$/.test(s)) return Number(s);
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function moneyTokens(line: string) {
  return (
    line.match(/\d{1,3}(?:[.,]\d{3})+[.,]\d{2}|\d+[.,]\d{2}|\d+(?:[.,]\d{1,3})?/g) ??
    []
  );
}

function asLine(row: unknown): ExpenseLine | null {
  if (!row || typeof row !== "object") return null;
  const it = row as Record<string, unknown>;
  const name = String(it.name ?? "").trim();
  const qty = Number(it.qty ?? 1);
  const unitCost = Number(it.unit_cost ?? it.unitCost ?? it.price ?? 0);
  if (!name || !Number.isFinite(qty) || !Number.isFinite(unitCost)) return null;
  if (qty <= 0) return null;
  return {
    name: name.slice(0, 120),
    qty,
    unitCost: round2(unitCost),
    productId: null,
  };
}

export function emptyDraft(): InvoiceDraft {
  return { vendor: "", date: "", invoiceNo: "", total: 0, items: [] };
}

export function normalizeInvoiceDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const named = s.match(/(\d{1,2})\s+([A-Za-zΑ-Ωα-ωΆ-ώΐΰ]+)\.?\s+(\d{4})/);
  if (named) {
    const key = fold(named[2]);
    const month = MONTH[key] ?? MONTH[key.slice(0, 3)];
    if (month) {
      return `${named[3]}-${month}-${named[1].padStart(2, "0")}`;
    }
  }
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!m) return s.slice(0, 20);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return s.slice(0, 20);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isScannedPdfText(text: string, pageCount = 1): boolean {
  const body = text.replace(/--- σελίδα \s*\d+ ---/gi, "");
  const compact = body.replace(/\s+/g, "");
  const letters = (body.match(/[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ]/g) || []).length;
  if (letters < 25) return true;
  if (compact.length >= 40 && letters / compact.length < 0.32) return true;
  if (letters / Math.max(1, pageCount) < 18) return true;
  return false;
}

function isBuyerName(s: string) {
  const f = fold(s.trim());
  return (
    f === "δοση" ||
    f.startsWith("δοση ") ||
    f.startsWith("dose") ||
    f === "πελατης" ||
    f.startsWith("ο πελατης")
  );
}

function looksCompany(s: string) {
  return /α\.?ε\.?|ε\.?π\.?ε\.?|ι\.?κ\.?ε\.?|ο\.?ε\.?|llc|ltd|gmbh|\bαε\b|\bεπε\b|\bικε\b/.test(
    fold(s),
  );
}

function pickVendor(a: string, b: string) {
  const left = a.trim();
  const right = b.trim();
  if (left && !isBuyerName(left)) {
    if (right && looksCompany(right) && !looksCompany(left) && !isBuyerName(right)) {
      return right.slice(0, 120);
    }
    return left.slice(0, 120);
  }
  if (right && !isBuyerName(right)) return right.slice(0, 120);
  return (left || right).slice(0, 120);
}

function pickInvoiceNo(a: string, b: string) {
  const left = a.trim();
  const right = b.trim();
  const ok = (s: string) => /\d/.test(s) && s.replace(/\D/g, "").length <= 12;
  if (left && ok(left)) return left.slice(0, 40);
  if (right && ok(right)) return right.slice(0, 40);
  return (left || right).slice(0, 40);
}

function sumItems(items: ExpenseLine[]) {
  return round2(items.reduce((s, it) => s + it.qty * it.unitCost, 0));
}

export function draftFromModel(parsed: Record<string, unknown>): InvoiceDraft {
  const itemsRaw = Array.isArray(parsed.items) ? parsed.items : [];
  const items = itemsRaw
    .map(asLine)
    .filter((x): x is ExpenseLine => x !== null)
    .filter((it) => !skipName(it.name) && !/^\d+$/.test(it.name));
  const total =
    Number(parsed.total) ||
    items.reduce((s, it) => s + it.qty * it.unitCost, 0);
  return {
    vendor: String(parsed.vendor ?? parsed.supplier ?? "").trim().slice(0, 120),
    date: normalizeInvoiceDate(
      String(parsed.date ?? parsed.invoice_date ?? "").trim(),
    ),
    invoiceNo: String(
      parsed.invoiceNo ?? parsed.invoice_no ?? parsed.number ?? "",
    )
      .trim()
      .slice(0, 40),
    total: round2(Number.isFinite(total) ? total : 0),
    items,
  };
}

export function mergeDrafts(ai: InvoiceDraft, heuristic: InvoiceDraft): InvoiceDraft {
  const aiSum = sumItems(ai.items);
  const hSum = sumItems(heuristic.items);
  const totalHint = ai.total || heuristic.total;
  let items = ai.items;
  if (!items.length) {
    items = heuristic.items;
  } else if (heuristic.items.length) {
    const aiErr = totalHint ? Math.abs(aiSum - totalHint) : Number.POSITIVE_INFINITY;
    const hErr = totalHint ? Math.abs(hSum - totalHint) : Number.POSITIVE_INFINITY;
    const heuristicCloser = hErr + 0.05 < aiErr;
    const richer =
      heuristic.items.length >= items.length + 1 &&
      hErr <= 0.08 &&
      (items.length === 1 || heuristicCloser);
    if (heuristicCloser || richer) items = heuristic.items;
  }
  const total =
    (totalHint && totalHint > 0 ? totalHint : 0) ||
    sumItems(items) ||
    ai.total ||
    heuristic.total;
  return {
    vendor: pickVendor(ai.vendor, heuristic.vendor),
    date: normalizeInvoiceDate(ai.date || heuristic.date),
    invoiceNo: pickInvoiceNo(ai.invoiceNo, heuristic.invoiceNo),
    total: round2(total),
    items,
  };
}

function cleanItemName(name: string) {
  return name
    .replace(/^\d{4,}\s+/, "")
    .replace(/\s+(?:τεμ\.?|τεμάχια|κιλ[άα]?|kg|lt|λίτρ[αο]?)\s*$/i, "")
    .replace(/[x×]\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseItemLine(line: string): ExpenseLine | null {
  const trimmed = line.replace(/\s+/g, " ").trim();
  if (trimmed.length < 4 || skipName(trimmed)) return null;

  const times = trimmed.match(
    /^(.{3,80}?)\s+(\d+(?:[.,]\d{1,3})?)\s*[x×]\s*(\d+(?:[.,]\d{2}))(?:\s+(\d+(?:[.,]\d{2})))?$/i,
  );
  if (times) {
    const name = cleanItemName(times[1]);
    const qty = parseMoney(times[2]);
    const unit = parseMoney(times[3]);
    if (name && qty && unit !== null && !skipName(name)) {
      return { name: name.slice(0, 120), qty, unitCost: round2(unit), productId: null };
    }
  }

  const tokens = moneyTokens(trimmed);
  if (tokens.length < 2) return null;

  const last = parseMoney(tokens[tokens.length - 1] ?? "");
  const unitTok = parseMoney(tokens[tokens.length - 2] ?? "");
  const qtyTok =
    tokens.length >= 3 ? parseMoney(tokens[tokens.length - 3] ?? "") : null;

  if (last === null || unitTok === null) return null;

  let qty = 1;
  let unitCost = unitTok;
  if (qtyTok !== null && qtyTok > 0 && qtyTok <= 999 && tokens.length >= 3) {
    qty = qtyTok;
    if (near(qty * unitTok, last) && last > 0) unitCost = unitTok;
    else if (near(qty * last, unitTok) && unitTok > 0) unitCost = last;
    else unitCost = unitTok;
  } else {
    unitCost = last;
  }

  let name = trimmed;
  for (const tok of tokens.slice(-3).reverse()) {
    const idx = name.lastIndexOf(tok);
    if (idx >= 0) name = name.slice(0, idx);
  }
  name = cleanItemName(
    name.replace(/\s+(?:τεμ\.?|τεμάχια|κιλ[άα]?|kg|lt|λίτρ[αο]?)\s*/gi, " ").trim(),
  );
  if (name.length < 2 || skipName(name) || /^\d+$/.test(name)) return null;
  if (unitCost <= 0) return null;
  return {
    name: name.slice(0, 120),
    qty: qty || 1,
    unitCost: round2(unitCost),
    productId: null,
  };
}

function extractInvoiceNo(raw: string): string {
  const hay = fold(raw);
  const patterns = [
    /(?:αρ(?:ιθμ(?:ος)?)?\.?|no\.?|number|τιμολ(?:ογιο)?|invoice|timologio|α\/α|αα)(?:\s*(?:τιμ(?:ολογιου)?|πωλ(?:ησης)?)?)?\s*[:.\s#№]+([a-zα-ω]{0,4}\s?\d[a-zα-ω0-9\-\/]{0,16})/,
    /\bar\s*[:.]?\s*(\d{2,8})\b/,
    /(?:σειρα)\s*[:.\s]+([a-zα-ω0-9\-\/]{1,12})/,
    /τιμολογιο\s+(?:πωλησης\s+)?(?:αρ\.?\s*)?([a-zα-ω]{0,4}\s?\d{2,8})/,
  ];
  for (const re of patterns) {
    const m = hay.match(re);
    if (m?.[1] && /\d/.test(m[1])) {
      const value = m[1].trim().replace(/\s+/g, " ");
      if (/^\d{9,}$/.test(value.replace(/\s/g, ""))) continue;
      return value.toUpperCase().slice(0, 40);
    }
  }
  return "";
}

function joinWrapped(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const next = lines[i + 1];
    if (
      next &&
      moneyTokens(line).length < 2 &&
      moneyTokens(next).length >= 2 &&
      !skipName(line) &&
      !HEADER_SKIP.test(fold(line)) &&
      line.length < 70 &&
      !/^\d/.test(line)
    ) {
      out.push(`${line} ${next}`);
      i += 1;
      continue;
    }
    out.push(line);
  }
  return out;
}

function pickVendorFromLines(lines: string[]): string {
  let afterBuyer = false;
  for (const line of lines.slice(0, 18)) {
    const f = fold(line);
    if (/πελατης|παραληπτης|buyer/.test(f)) {
      afterBuyer = true;
      continue;
    }
    if (afterBuyer) continue;
    if (HEADER_SKIP.test(f) || skipName(line)) continue;
    if (isBuyerName(line)) continue;
    if (/^\d/.test(line)) continue;
    if (line.length < 3 || line.length > 80) continue;
    if (/@|www\.|http/i.test(line)) continue;
    return line.slice(0, 120);
  }
  return "";
}

export function parseInvoiceText(raw: string): InvoiceDraft {
  const normalized = raw.replace(/\u00a0/g, " ").replace(/\r/g, "");
  let lines = normalized
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  if (lines.length < 3) {
    lines = normalized
      .split(/(?<=\d[.,]\d{2})\s+(?=[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ])/)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  lines = joinWrapped(lines);
  const vendor = pickVendorFromLines(lines);
  const folded = fold(normalized);

  let date = "";
  const dateLabel = folded.match(
    /(?:ημερομηνια|ημ\/νια|date)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[a-zα-ω]+\.?\s+\d{4})/,
  );
  const dateAny = normalized.match(
    /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(\d{4}-\d{2}-\d{2})|(\d{1,2}\s+[Α-Ωα-ωΆ-ώΐΰ]+\.?\s+\d{4})/,
  );
  if (dateLabel) date = normalizeInvoiceDate(dateLabel[1]);
  else if (dateAny) date = normalizeInvoiceDate(dateAny[0]);

  const invoiceNo = extractInvoiceNo(normalized);

  const items: ExpenseLine[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const item = parseItemLine(line);
    if (!item) continue;
    const key = `${item.name}|${item.qty}|${item.unitCost}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length >= 40) break;
  }

  const totalMatch = folded.match(
    /(?:πληρωτεο|γενικο\s*συνολο|τελικη\s*αξια|συνολο\s*(?:αξιας|πληρωμ)?|total|grand|synola|συνολα)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})/,
  );
  const total =
    (totalMatch ? parseMoney(totalMatch[1]) : null) ||
    items.reduce((s, it) => s + it.qty * it.unitCost, 0);

  return {
    vendor,
    date,
    invoiceNo,
    total: round2(total || 0),
    items,
  };
}
