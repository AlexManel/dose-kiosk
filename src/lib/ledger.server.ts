import { getSql } from "@/lib/db";
import { fetchCatalog } from "@/lib/dose.server";
import type { Product } from "@/lib/catalog";
import {
  draftFromModel,
  emptyDraft,
  isScannedPdfText,
  mergeDrafts,
  parseInvoiceText,
} from "@/lib/invoice-parse";
import {
  draftFromZModel,
  emptyZ,
  mergeZDrafts,
  parseZText,
  type ZDraft,
  type ZKind,
} from "@/lib/z-parse";
import type {
  Expense,
  ExpenseLine,
  InvoiceDraft,
  Ledger,
  PayKind,
  Sale,
  SaleChannel,
  TillCheck,
  TillEvent,
  TillMove,
  TillSession,
  TillSnapshot,
} from "@/lib/ledger";
import { expectedCash } from "@/lib/till";

function num(v: string | number | boolean | null | undefined) {
  if (typeof v === "boolean") return v ? 1 : 0;
  return Number(v ?? 0);
}

function flag(v: unknown) {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function iso(v: string | Date) {
  return typeof v === "string" ? v : new Date(v).toISOString();
}

function asPay(v: unknown): PayKind {
  if (v === "cash" || v === "card" || v === "transfer") return v;
  return "transfer";
}

function nid(prefix: string) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9α-ωάέήίόύώ\s]/gi, "")
    .trim();
}

export function matchProduct(name: string, products: Product[]): Product | undefined {
  const n = fold(name);
  if (!n) return undefined;
  return products.find((p) => {
    const pn = fold(p.name);
    return pn === n || pn.includes(n) || n.includes(pn);
  });
}

function resolveMatch(
  it: ExpenseLine,
  products: Product[],
): string | null {
  if (it.productId && products.some((p) => p.id === it.productId)) return it.productId;
  return matchProduct(it.name, products)?.id ?? null;
}

export async function insertSale(input: {
  items: { id: string; qty: number }[];
  channel: SaleChannel;
  pay: "cash" | "card";
  fee: number;
}) {
  const catalog = await fetchCatalog();
  const lines: { product: Product; qty: number }[] = [];
  for (const item of input.items) {
    const qty = Math.round(item.qty);
    if (!Number.isFinite(qty) || qty < 1 || qty > 30) {
      throw new Error("Άκυρη ποσότητα");
    }
    const product = catalog.products.find((p) => p.id === item.id);
    if (!product) throw new Error("Το προϊόν δεν υπάρχει");
    if (product.stock < qty) {
      throw new Error(`Δεν επαρκεί το απόθεμα για ${product.name}`);
    }
    lines.push({ product, qty });
  }
  if (lines.length === 0) throw new Error("Άδεια παραγγελία");

  const sub = round2(lines.reduce((s, l) => s + l.product.price * l.qty, 0));
  const fee = input.channel === "delivery" ? Number(input.fee) || 0 : 0;
  const grand = round2(sub + fee);
  const id = nid("s");
  const sql = await getSql();

  await sql`
    insert into sales (id, channel, pay, sub, fee, grand)
    values (${id}, ${input.channel}, ${input.pay}, ${sub}, ${fee}, ${grand})
  `;

  const applied: { id: string; qty: number }[] = [];
  try {
    for (const line of lines) {
      const updated = await sql<{ id: string }>`
        update products
        set stock = stock - ${line.qty}
        where id = ${line.product.id} and stock >= ${line.qty}
        returning id
      `;
      if (!updated[0]) {
        throw new Error(`Δεν επαρκεί το απόθεμα για ${line.product.name}`);
      }
      applied.push({ id: line.product.id, qty: line.qty });
      await sql`
        insert into sale_items (sale_id, product_id, name, qty, price)
        values (${id}, ${line.product.id}, ${line.product.name}, ${line.qty}, ${line.product.price})
      `;
    }
  } catch (error) {
    for (const row of applied) {
      await sql`update products set stock = stock + ${row.qty} where id = ${row.id}`;
    }
    await sql`delete from sale_items where sale_id = ${id}`;
    await sql`delete from sales where id = ${id}`;
    throw error;
  }

  return fetchCatalog();
}

export async function deleteSale(id: string) {
  const sql = await getSql();
  const items = await sql<{ product_id: string | null; qty: number }>`
    select product_id, qty from sale_items where sale_id = ${id}
  `;
  if (!items.length) {
    const exists = await sql<{ id: string }>`select id from sales where id = ${id}`;
    if (!exists[0]) throw new Error("Δεν βρέθηκε η πώληση");
  }
  for (const it of items) {
    if (it.product_id) {
      await sql`update products set stock = stock + ${Number(it.qty)} where id = ${it.product_id}`;
    }
  }
  await sql`delete from sale_items where sale_id = ${id}`;
  await sql`delete from sales where id = ${id}`;
  return fetchCatalog();
}

async function writeExpenseItems(
  id: string,
  items: ExpenseLine[],
  restock: boolean,
) {
  const catalog = await fetchCatalog();
  const sql = await getSql();
  for (const it of items) {
    const matched = resolveMatch(it, catalog.products);
    await sql`
      insert into expense_items (expense_id, name, qty, unit_cost, product_id)
      values (${id}, ${it.name.trim()}, ${it.qty}, ${round2(it.unitCost)}, ${matched})
    `;
    if (restock && matched) {
      const add = Math.max(0, Math.round(it.qty));
      await sql`update products set stock = stock + ${add} where id = ${matched}`;
    }
  }
}

async function reverseRestock(id: string) {
  const sql = await getSql();
  const items = await sql<{ product_id: string | null; qty: string | number }>`
    select product_id, qty from expense_items where expense_id = ${id}
  `;
  for (const it of items) {
    if (!it.product_id) continue;
    const q = Math.max(0, Math.round(num(it.qty)));
    await sql`update products set stock = greatest(0, stock - ${q}) where id = ${it.product_id}`;
  }
}

export async function insertExpense(input: {
  vendor: string;
  note: string;
  photo: string;
  invoiceNo: string;
  invoiceDate: string;
  items: ExpenseLine[];
  restock: boolean;
  pay: PayKind;
}) {
  const items = input.items.filter((it) => it.name.trim() && it.qty > 0);
  if (items.length === 0) throw new Error("Πρόσθεσε γραμμές τιμολογίου");
  const total = round2(items.reduce((s, it) => s + it.qty * it.unitCost, 0));
  const id = nid("e");
  const sql = await getSql();

  await sql`
    insert into expenses (id, vendor, note, photo, total, invoice_no, invoice_date, restocked, pay)
    values (
      ${id}, ${input.vendor.trim()}, ${input.note.trim()}, ${input.photo}, ${total},
      ${input.invoiceNo.trim()}, ${input.invoiceDate.trim()}, ${input.restock}, ${input.pay}
    )
  `;
  await writeExpenseItems(id, items, input.restock);
  return fetchCatalog();
}

export async function updateExpense(input: {
  id: string;
  vendor: string;
  note: string;
  photo: string;
  invoiceNo: string;
  invoiceDate: string;
  items: ExpenseLine[];
  restock: boolean;
  pay: PayKind;
}) {
  const items = input.items.filter((it) => it.name.trim() && it.qty > 0);
  if (items.length === 0) throw new Error("Πρόσθεσε γραμμές τιμολογίου");
  const sql = await getSql();
  const existing = await sql<{ id: string; restocked: unknown }>`
    select id, restocked from expenses where id = ${input.id}
  `;
  if (!existing[0]) throw new Error("Δεν βρέθηκε το τιμολόγιο");
  if (flag(existing[0].restocked)) await reverseRestock(input.id);
  await sql`delete from expense_items where expense_id = ${input.id}`;
  const total = round2(items.reduce((s, it) => s + it.qty * it.unitCost, 0));
  await sql`
    update expenses set
      vendor = ${input.vendor.trim()},
      note = ${input.note.trim()},
      photo = ${input.photo},
      total = ${total},
      invoice_no = ${input.invoiceNo.trim()},
      invoice_date = ${input.invoiceDate.trim()},
      restocked = ${input.restock},
      pay = ${input.pay}
    where id = ${input.id}
  `;
  await writeExpenseItems(input.id, items, input.restock);
  return fetchCatalog();
}

export async function deleteExpense(id: string) {
  const sql = await getSql();
  const existing = await sql<{ id: string; restocked: unknown }>`
    select id, restocked from expenses where id = ${id}
  `;
  if (!existing[0]) throw new Error("Δεν βρέθηκε το τιμολόγιο");
  if (flag(existing[0].restocked)) await reverseRestock(id);
  await sql`delete from expense_items where expense_id = ${id}`;
  await sql`delete from expenses where id = ${id}`;
  return fetchCatalog();
}

function asSession(row: {
  id: string;
  opened_at: string;
  closed_at: string | null;
  open_float: string | number;
  counted_cash: string | number | null;
  note: string;
  closed: unknown;
}): TillSession {
  return {
    id: row.id,
    openedAt: iso(row.opened_at),
    closedAt: row.closed_at ? iso(row.closed_at) : null,
    openFloat: num(row.open_float),
    countedCash: row.counted_cash == null ? null : num(row.counted_cash),
    closed: flag(row.closed) || Boolean(row.closed_at),
    note: row.note ?? "",
  };
}

async function requireOpenSession() {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    opened_at: string;
    closed_at: string | null;
    open_float: string | number;
    counted_cash: string | number | null;
    note: string;
    closed: unknown;
  }>`select id, opened_at, closed_at, open_float, counted_cash, note, closed
     from till_sessions where closed = false order by opened_at desc limit 1`;
  if (!rows[0]) throw new Error("Άνοιξε πρώτα το ταμείο");
  return asSession(rows[0]);
}

export async function openTill(input: { openFloat: number; note: string }) {
  const sql = await getSql();
  const open = await sql<{ id: string }>`
    select id from till_sessions where closed = false limit 1
  `;
  if (open[0]) throw new Error("Υπάρχει ήδη ανοιχτό ταμείο");
  const float = round2(Math.max(0, Number(input.openFloat) || 0));
  const id = nid("t");
  await sql`
    insert into till_sessions (id, open_float, note, closed)
    values (${id}, ${float}, ${input.note.trim()}, false)
  `;
  return fetchLedger();
}

export async function closeTill(input: { countedCash: number; note: string }) {
  const session = await requireOpenSession();
  const counted = round2(Math.max(0, Number(input.countedCash) || 0));
  const sql = await getSql();
  await sql`
    update till_sessions
    set closed = true, closed_at = now(), counted_cash = ${counted}, note = ${input.note.trim()}
    where id = ${session.id} and closed = false
  `;
  return fetchLedger();
}

export async function addTillMove(input: {
  kind: "in" | "out";
  amount: number;
  reason: string;
}) {
  const session = await requireOpenSession();
  const amount = round2(Number(input.amount) || 0);
  if (amount <= 0) throw new Error("Βάλε ποσό");
  const sql = await getSql();
  const id = nid("m");
  await sql`
    insert into till_moves (id, session_id, kind, amount, reason)
    values (${id}, ${session.id}, ${input.kind}, ${amount}, ${input.reason.trim().slice(0, 80)})
  `;
  return fetchLedger();
}

export async function deleteTillMove(id: string) {
  const session = await requireOpenSession();
  const sql = await getSql();
  const row = await sql<{ id: string }>`
    delete from till_moves where id = ${id} and session_id = ${session.id} returning id
  `;
  if (!row[0]) throw new Error("Δεν βρέθηκε η κίνηση");
  return fetchLedger();
}

export async function saveTillCheck(input: {
  zCash: number | null;
  zCard: number | null;
  posCard: number | null;
  note: string;
  zPhoto?: string;
  posPhoto?: string;
}) {
  const session = await requireOpenSession();
  const sql = await getSql();
  const prev = await sql<{ z_photo: string; pos_photo: string }>`
    select z_photo, pos_photo from till_checks
    where session_id = ${session.id} order by at desc limit 1
  `;
  const zPhoto = (input.zPhoto && input.zPhoto.length > 40
    ? input.zPhoto
    : prev[0]?.z_photo) ?? "";
  const posPhoto = (input.posPhoto && input.posPhoto.length > 40
    ? input.posPhoto
    : prev[0]?.pos_photo) ?? "";
  const id = nid("z");
  await sql`
    insert into till_checks (id, session_id, z_cash, z_card, pos_card, note, z_photo, pos_photo)
    values (
      ${id}, ${session.id},
      ${input.zCash == null ? null : round2(input.zCash)},
      ${input.zCard == null ? null : round2(input.zCard)},
      ${input.posCard == null ? null : round2(input.posCard)},
      ${input.note.trim().slice(0, 120)}, ${zPhoto}, ${posPhoto}
    )
  `;
  return fetchLedger();
}

async function loadTill(): Promise<TillSnapshot> {
  const empty: TillSnapshot = {
    session: null,
    expectedCash: 0,
    cashSales: 0,
    cardSales: 0,
    cashSpend: 0,
    cardSpend: 0,
    transferSpend: 0,
    movesIn: 0,
    movesOut: 0,
    variance: null,
    zCashDiff: null,
    zCardDiff: null,
    posDiff: null,
    lastCheck: null,
    moves: [],
    checks: [],
    events: [],
    closedSessions: [],
  };
  const sql = await getSql();
  const closedRows = await sql<{
    id: string;
    opened_at: string;
    closed_at: string | null;
    open_float: string | number;
    counted_cash: string | number | null;
    note: string;
    closed: unknown;
  }>`select id, opened_at, closed_at, open_float, counted_cash, note, closed
     from till_sessions where closed = true order by opened_at desc limit 8`;
  empty.closedSessions = closedRows.map(asSession);

  const openRows = await sql<{
    id: string;
    opened_at: string;
    closed_at: string | null;
    open_float: string | number;
    counted_cash: string | number | null;
    note: string;
    closed: unknown;
  }>`select id, opened_at, closed_at, open_float, counted_cash, note, closed
     from till_sessions where closed = false order by opened_at desc limit 1`;

  const session = openRows[0]
    ? asSession(openRows[0])
    : closedRows[0]
      ? asSession(closedRows[0])
      : null;
  if (!session) return empty;

  const since = session.openedAt;
  const cashSalesRows = await sql<{ v: string | number }>`
    select coalesce(sum(grand), 0) as v from sales where pay = 'cash' and at >= ${since}
  `;
  const cardSalesRows = await sql<{ v: string | number }>`
    select coalesce(sum(grand), 0) as v from sales where pay = 'card' and at >= ${since}
  `;
  const cashSpendRows = await sql<{ v: string | number }>`
    select coalesce(sum(total), 0) as v from expenses where pay = 'cash' and at >= ${since}
  `;
  const cardSpendRows = await sql<{ v: string | number }>`
    select coalesce(sum(total), 0) as v from expenses where pay = 'card' and at >= ${since}
  `;
  const transferSpendRows = await sql<{ v: string | number }>`
    select coalesce(sum(total), 0) as v from expenses where pay = 'transfer' and at >= ${since}
  `;

  const moveRows = await sql<{
    id: string;
    at: string;
    kind: string;
    amount: string | number;
    reason: string;
  }>`select id, at, kind, amount, reason from till_moves
     where session_id = ${session.id} order by at desc`;

  const checkRows = await sql<{
    id: string;
    at: string;
    z_cash: string | number | null;
    z_card: string | number | null;
    pos_card: string | number | null;
    note: string;
    z_photo: string;
    pos_photo: string;
  }>`select id, at, z_cash, z_card, pos_card, note, z_photo, pos_photo from till_checks
     where session_id = ${session.id} order by at desc`;

  const moves: TillMove[] = moveRows.map((row) => ({
    id: row.id,
    at: iso(row.at),
    kind: row.kind === "out" ? "out" : "in",
    amount: num(row.amount),
    reason: row.reason,
  }));
  const checks: TillCheck[] = checkRows.map((row) => ({
    id: row.id,
    at: iso(row.at),
    zCash: row.z_cash == null ? null : num(row.z_cash),
    zCard: row.z_card == null ? null : num(row.z_card),
    posCard: row.pos_card == null ? null : num(row.pos_card),
    note: row.note,
    zPhoto: row.z_photo ?? "",
    posPhoto: row.pos_photo ?? "",
  }));

  const cashSales = round2(num(cashSalesRows[0]?.v));
  const cardSales = round2(num(cardSalesRows[0]?.v));
  const cashSpend = round2(num(cashSpendRows[0]?.v));
  const cardSpend = round2(num(cardSpendRows[0]?.v));
  const transferSpend = round2(num(transferSpendRows[0]?.v));
  const movesIn = round2(
    moves.filter((m) => m.kind === "in").reduce((s, m) => s + m.amount, 0),
  );
  const movesOut = round2(
    moves.filter((m) => m.kind === "out").reduce((s, m) => s + m.amount, 0),
  );
  const expected = expectedCash({
    openFloat: session.openFloat,
    cashSales,
    cashSpend,
    movesIn,
    movesOut,
  });
  const lastCheck = checks[0] ?? null;
  const variance =
    session.countedCash == null ? null : round2(session.countedCash - expected);

  const saleRows = await sql<{
    id: string;
    at: string;
    channel: string;
    pay: string;
    grand: string | number;
  }>`select id, at, channel, pay, grand from sales where at >= ${since} order by at desc`;
  const expRows = await sql<{
    id: string;
    at: string;
    vendor: string;
    pay: string;
    total: string | number;
  }>`select id, at, vendor, pay, total from expenses where at >= ${since} order by at desc`;

  const events: TillEvent[] = [
    ...saleRows.map((row) => ({
      id: row.id,
      at: iso(row.at),
      title: row.pay === "card" ? "Πώληση κάρτα" : "Πώληση μετρητά",
      detail: row.channel === "walkin" ? "Ταμείο" : "Delivery",
      amount: num(row.grand),
      cashDelta: row.pay === "cash" ? num(row.grand) : 0,
    })),
    ...expRows.map((row) => ({
      id: row.id,
      at: iso(row.at),
      title: row.pay === "cash" ? "Έξοδο μετρητά" : row.pay === "card" ? "Έξοδο κάρτα" : "Έξοδο έμβασμα",
      detail: row.vendor || "Αγορά",
      amount: num(row.total),
      cashDelta: row.pay === "cash" ? -num(row.total) : 0,
    })),
    ...moves.map((m) => ({
      id: m.id,
      at: m.at,
      title: m.kind === "in" ? "Κατάθεση συρταριού" : "Ανάληψη συρταριού",
      detail: m.reason || "Κίνηση",
      amount: m.amount,
      cashDelta: m.kind === "in" ? m.amount : -m.amount,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    session,
    expectedCash: expected,
    cashSales,
    cardSales,
    cashSpend,
    cardSpend,
    transferSpend,
    movesIn,
    movesOut,
    variance,
    zCashDiff: lastCheck?.zCash == null ? null : round2(lastCheck.zCash - cashSales),
    zCardDiff: lastCheck?.zCard == null ? null : round2(lastCheck.zCard - cardSales),
    posDiff: lastCheck?.posCard == null ? null : round2(lastCheck.posCard - cardSales),
    lastCheck,
    moves,
    checks,
    events: events.slice(0, 40),
    closedSessions: empty.closedSessions,
  };
}

export async function fetchLedger(): Promise<Ledger> {
  const sql = await getSql();
  const saleRows = await sql<{
    id: string;
    at: string;
    channel: string;
    pay: string;
    sub: string | number;
    fee: string | number;
    grand: string | number;
  }>`select id, at, channel, pay, sub, fee, grand from sales order by at desc limit 80`;

  const itemRows = saleRows.length
    ? await sql<{
        sale_id: string;
        product_id: string | null;
        name: string;
        qty: number;
        price: string | number;
      }>`select sale_id, product_id, name, qty, price from sale_items`
    : [];

  const itemsBySale = new Map<string, Sale["items"]>();
  for (const row of itemRows) {
    const list = itemsBySale.get(row.sale_id) ?? [];
    list.push({
      productId: row.product_id ?? "",
      name: row.name,
      qty: Number(row.qty),
      price: num(row.price),
    });
    itemsBySale.set(row.sale_id, list);
  }

  const sales: Sale[] = saleRows.map((row) => ({
    id: row.id,
    at: iso(row.at),
    channel: row.channel === "walkin" ? "walkin" : "delivery",
    pay: row.pay === "card" ? "card" : "cash",
    sub: num(row.sub),
    fee: num(row.fee),
    grand: num(row.grand),
    items: itemsBySale.get(row.id) ?? [],
  }));

  const expRows = await sql<{
    id: string;
    at: string;
    vendor: string;
    note: string;
    photo: string;
    total: string | number;
    invoice_no: string;
    invoice_date: string;
    restocked: unknown;
    pay: string;
  }>`select id, at, vendor, note, photo, total, invoice_no, invoice_date, restocked, pay
     from expenses order by at desc limit 80`;

  const expItemRows = expRows.length
    ? await sql<{
        expense_id: string;
        name: string;
        qty: string | number;
        unit_cost: string | number;
        product_id: string | null;
      }>`select expense_id, name, qty, unit_cost, product_id from expense_items`
    : [];

  const itemsByExp = new Map<string, ExpenseLine[]>();
  for (const row of expItemRows) {
    const list = itemsByExp.get(row.expense_id) ?? [];
    list.push({
      name: row.name,
      qty: num(row.qty),
      unitCost: num(row.unit_cost),
      productId: row.product_id,
    });
    itemsByExp.set(row.expense_id, list);
  }

  const expenses: Expense[] = expRows.map((row) => ({
    id: row.id,
    at: iso(row.at),
    vendor: row.vendor,
    note: row.note,
    photo: row.photo,
    total: num(row.total),
    invoiceNo: row.invoice_no ?? "",
    invoiceDate: row.invoice_date ?? "",
    restocked: flag(row.restocked),
    pay: asPay(row.pay),
    items: itemsByExp.get(row.id) ?? [],
  }));

  const catalog = await fetchCatalog();
  const income = round2(sales.reduce((s, x) => s + x.grand, 0));
  const spend = round2(expenses.reduce((s, x) => s + x.total, 0));
  const cashIncome = round2(
    sales.filter((s) => s.pay === "cash").reduce((s, x) => s + x.grand, 0),
  );
  const cardIncome = round2(
    sales.filter((s) => s.pay === "card").reduce((s, x) => s + x.grand, 0),
  );
  const till = await loadTill();

  return {
    income,
    spend,
    profit: round2(income - spend),
    cashIncome,
    cardIncome,
    salesCount: sales.length,
    sales,
    expenses,
    lowStock: catalog.products
      .filter((p) => p.stock <= 5)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    till,
  };
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed) as Record<string, unknown>;
}

const INVOICE_SYSTEM = `Είσαι αναγνώστης ελληνικών παραστατικών ΑΑΔΕ (τιμολόγιο πώλησης, δελτίο αποστολής, απόδειξη λιανικής, τιμολόγιο αγοράς).
Απάντησε ΜΟΝΟ JSON:
{"vendor":"","invoice_no":"","date":"YYYY-MM-DD","total":0,"items":[{"name":"","qty":1,"unit_cost":0}]}

vendor = επωνυμία ΠΡΟΜΗΘΕΥΤΗ / εκδότη (πάνω αριστερά ή σφραγίδα). ΟΧΙ ο πελάτης (συχνά «ΔΟΣΗ» / Dose / ο αγοραστής κάτω ή δεξιά).
invoice_no = Αριθμός παραστατικού (π.χ. Α 4521, ΑΡ. 123, σειρά+αριθμός). Μην πάρεις το ΑΦΜ.
date = ημερομηνία έκδοσης, προτίμησε YYYY-MM-DD.
total = Πληρωτέο / Γενικό σύνολο (το ποσό που πληρώνεται), number.
items = γραμμές ειδών. name στα ελληνικά όπως τυπώνεται. qty = ποσότητα (τεμάχια/κιλά). unit_cost = τιμή μονάδας χωρίς €.
Αν υπάρχει αξία γραμμής και ποσότητα: unit_cost = αξία/qty.
Αγνόησε: ΦΠΑ %, κωδικούς συντελεστή, ΙΒΑΝ, υπογραφές, ΑΦΜ σκέτο, σύνοψη εκπτώσεων, «Ο ΠΕΛΑΤΗΣ», επικεφαλίδες πίνακα (ΠΕΡΙΓΡΑΦΗ/ΠΟΣΟΤΗΤΑ/ΑΞΙΑ), αντίγραφο, μεταφορικά 0.
Μην εφεύρεις γραμμές. Αν όνομα σπάει σε 2 σειρές, ένωσέ το.`;

async function askInvoiceModel(
  apiKey: string,
  input: { images: string[]; text: string; scanned: boolean },
): Promise<InvoiceDraft> {
  const images = input.images.filter((u) => u.startsWith("data:")).slice(0, 4);
  const textBlock = input.text.trim().slice(0, 12_000);
  const intro = input.scanned
    ? "Το PDF είναι σκαναρισμένο (εικόνα, όχι selectable text). Κάνε OCR στις εικόνες. Η 1η είναι ολόκληρη σελίδα· οι επόμενες είναι μεγέθυνση κεφαλίδας ή πίνακα προϊόντων. Διάβασε μικρή γραμματοσειρά. Συνένωσε γραμμές από πολλές σελίδες."
    : "Διάβασε το κείμενο PDF μαζί με τις εικόνες σελίδων (πίνακες, σφραγίδες, αριθμός παραστατικού).";

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } }
  > = [
    {
      type: "text",
      text: textBlock
        ? `${intro}\n\nΚείμενο PDF:\n${textBlock}`
        : `${intro} Βγάλε προμηθευτή, αριθμό, ημερομηνία, γραμμές και πληρωτέο σύνολο.`,
    },
  ];
  for (const url of images) {
    userContent.push({
      type: "image_url",
      image_url: { url, detail: "high" },
    });
  }

  const payload = {
    model: "grok-4.5",
    max_tokens: 2000,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: INVOICE_SYSTEM },
      { role: "user", content: userContent },
    ],
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("api");
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return draftFromModel(
        parseJsonObject(body.choices?.[0]?.message?.content ?? "{}"),
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("api");
    }
  }
  throw lastError ?? new Error("api");
}

export async function readInvoice(input: {
  image: string;
  images?: string[];
  text: string;
  scanned?: boolean;
}): Promise<InvoiceDraft> {
  const text = input.text.trim();
  const images = (input.images?.length ? input.images : [input.image]).filter(
    (u) => (u ?? "").length > 40,
  );
  const scanned = input.scanned ?? isScannedPdfText(text);
  const heuristic = text.length >= 20 ? parseInvoiceText(text) : emptyDraft();
  const apiKey = process.env.XAI_API_KEY;

  if (apiKey && (images.length || text.length >= 20)) {
    try {
      const ai = await askInvoiceModel(apiKey, { images, text, scanned });
      const merged = mergeDrafts(ai, heuristic);
      if (merged.items.length || merged.vendor || merged.total) return merged;
    } catch {
      /* fall through */
    }
  }

  if (heuristic.items.length || heuristic.vendor) return heuristic;

  if (!apiKey) {
    throw new Error(
      "Δεν μπόρεσα να διαβάσω αυτόματα το αρχείο. Πέρασε τις γραμμές με το χέρι — το PDF/φωτογραφία μένει συνημμένο.",
    );
  }
  throw new Error("Ασαφές τιμολόγιο. Συμπλήρωσε τις γραμμές και αποθήκευσε.");
}

const Z_SYSTEM = `Είσαι αναγνώστης ημερήσιων αναφορών ταμειακής μηχανής (Έκθεση Ζ / Z-report) και παρτίδων POS (Viva, Cardlink, Worldline, Nexi, myPOS, EDPS, ICS, Datecs, RBS).
Απάντησε ΜΟΝΟ JSON:
{"kind":"z"|"pos","cash":null,"card":null,"total":null,"receipts":null,"date":"YYYY-MM-DD"}

kind = "z" αν είναι Ζ ταμειακής / ημερήσιο κλείσιμο. kind = "pos" αν είναι settlement / παρτίδα κάρτας.
cash = σύνολο ΜΕΤΡΗΤΩΝ πωλήσεων (ΜΕΤΡΗΤΑ / ΜΕΤΡΗΤΟΙΣ / CASH). Όχι αρχικό ταμείο, όχι ΦΠΑ, όχι συρτάρι.
card = σύνολο ΚΑΡΤΩΝ (ΚΑΡΤΕΣ / ΚΑΡΤΑ / POS / CREDIT).
total = γενικό σύνολο πωλήσεων / GROSS / μικτό / σύνολο παρτίδας. Όχι NET / καθαρό (προμήθεια).
receipts = πλήθος αποδείξεων ή συναλλαγών αν υπάρχει.
Σε θερμική απόδειξη τα ποσά είναι συχνά στην ΕΠΟΜΕΝΗ γραμμή από την ετικέτα.
Αγνόησε ΑΦΜ, αριθμό μηχανής, ΦΠΑ %, υπογραφές, IBAN, Z number.
Μην εφεύρεις ποσά. Αν λείπει πεδίο: null.
Αν είναι POS χωρίς μετρητά: cash=null, card=σύνολο παρτίδας (GROSS, όχι NET).`;

async function askZModel(
  apiKey: string,
  input: { images: string[]; text: string; scanned: boolean; kind: ZKind },
): Promise<ZDraft> {
  const images = input.images.filter((u) => u.startsWith("data:")).slice(0, 3);
  const textBlock = input.text.trim().slice(0, 8_000);
  const intro = input.scanned
    ? "Σκαναρισμένο έγγραφο. Διάβασε τα ποσά ΜΕΣΑ στις εικόνες."
    : "Διάβασε το κείμενο μαζί με τις εικόνες.";
  const hint =
    input.kind === "pos"
      ? "Αυτό είναι παρτίδα POS — θέλω κυρίως το σύνολο καρτών."
      : "Αυτό είναι Z ταμειακής — θέλω μετρητά και κάρτες χωριστά.";

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } }
  > = [
    {
      type: "text",
      text: textBlock
        ? `${intro} ${hint}\n\nΚείμενο:\n${textBlock}`
        : `${intro} ${hint}`,
    },
  ];
  for (const url of images) {
    userContent.push({
      type: "image_url",
      image_url: { url, detail: "high" },
    });
  }

  const payload = {
    model: "grok-4.5",
    max_tokens: 600,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: Z_SYSTEM },
      { role: "user", content: userContent },
    ],
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("api");
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return draftFromZModel(
        parseJsonObject(body.choices?.[0]?.message?.content ?? "{}"),
        input.kind,
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("api");
    }
  }
  throw lastError ?? new Error("api");
}

export async function readZReport(input: {
  image: string;
  images?: string[];
  text: string;
  scanned?: boolean;
  kind: ZKind;
}): Promise<ZDraft> {
  const text = input.text.trim();
  const images = (input.images?.length ? input.images : [input.image]).filter(
    (u) => (u ?? "").length > 40,
  );
  const scanned = input.scanned ?? isScannedPdfText(text);
  const heuristic = text.length >= 12 ? parseZText(text, input.kind) : emptyZ(input.kind);
  const apiKey = process.env.XAI_API_KEY;

  if (apiKey && (images.length || text.length >= 12)) {
    try {
      const ai = await askZModel(apiKey, {
        images,
        text,
        scanned,
        kind: input.kind,
      });
      const merged = mergeZDrafts(ai, heuristic);
      if (merged.cash != null || merged.card != null || merged.total != null) {
        return merged;
      }
    } catch {
      /* fall through */
    }
  }

  if (heuristic.cash != null || heuristic.card != null || heuristic.total != null) {
    return heuristic;
  }

  throw new Error(
    "Δεν διάβασα ποσά από το Z/POS. Γράψε τα σύνολα με το χέρι και σύγκρινε.",
  );
}
