export type SaleChannel = "delivery" | "walkin";
export type PayKind = "cash" | "card" | "transfer";

export type SaleLine = {
  productId: string;
  name: string;
  qty: number;
  price: number;
};

export type Sale = {
  id: string;
  at: string;
  channel: SaleChannel;
  pay: "cash" | "card";
  sub: number;
  fee: number;
  grand: number;
  items: SaleLine[];
};

export type ExpenseLine = {
  name: string;
  qty: number;
  unitCost: number;
  productId: string | null;
};

export type Expense = {
  id: string;
  at: string;
  vendor: string;
  note: string;
  photo: string;
  total: number;
  invoiceNo: string;
  invoiceDate: string;
  restocked: boolean;
  pay: PayKind;
  items: ExpenseLine[];
};

export type TillMove = {
  id: string;
  at: string;
  kind: "in" | "out";
  amount: number;
  reason: string;
};

export type TillCheck = {
  id: string;
  at: string;
  zCash: number | null;
  zCard: number | null;
  posCard: number | null;
  note: string;
  zPhoto: string;
  posPhoto: string;
};

export type TillSession = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openFloat: number;
  countedCash: number | null;
  closed: boolean;
  note: string;
};

export type TillEvent = {
  id: string;
  at: string;
  title: string;
  detail: string;
  amount: number;
  cashDelta: number;
};

export type TillSnapshot = {
  session: TillSession | null;
  expectedCash: number;
  cashSales: number;
  cardSales: number;
  cashSpend: number;
  cardSpend: number;
  transferSpend: number;
  movesIn: number;
  movesOut: number;
  variance: number | null;
  zCashDiff: number | null;
  zCardDiff: number | null;
  posDiff: number | null;
  lastCheck: TillCheck | null;
  moves: TillMove[];
  checks: TillCheck[];
  events: TillEvent[];
  closedSessions: TillSession[];
};

export type Ledger = {
  income: number;
  spend: number;
  profit: number;
  cashIncome: number;
  cardIncome: number;
  salesCount: number;
  sales: Sale[];
  expenses: Expense[];
  lowStock: { id: string; name: string; stock: number }[];
  till: TillSnapshot;
};

export type InvoiceDraft = {
  vendor: string;
  date: string;
  invoiceNo: string;
  total: number;
  items: ExpenseLine[];
};
