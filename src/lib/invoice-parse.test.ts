import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isScannedPdfText,
  mergeDrafts,
  normalizeInvoiceDate,
  parseInvoiceText,
  parseMoney,
  emptyDraft,
  draftFromModel,
} from "./invoice-parse.ts";

describe("parseInvoiceText — digital sample", () => {
  it("reads the Dose sample PDF text", () => {
    const draft = parseInvoiceText(`KAFEKOPTEIO LAZARIDI
Timologio AR 4521
10/09/2026

Espresso 5 0.60 3.00
Nero 12 0.20 2.40

SYNOLA 5.40`);
    assert.equal(draft.vendor, "KAFEKOPTEIO LAZARIDI");
    assert.equal(draft.invoiceNo, "AR 4521");
    assert.equal(draft.date, "2026-09-10");
    assert.equal(draft.items.length, 2);
    assert.equal(draft.items[0].name, "Espresso");
    assert.equal(draft.items[0].qty, 5);
    assert.equal(draft.items[0].unitCost, 0.6);
    assert.equal(draft.items[1].name, "Nero");
    assert.equal(draft.items[1].qty, 12);
    assert.equal(draft.total, 5.4);
  });
});

describe("parseInvoiceText — Greek ΑΑΔΕ", () => {
  const greek = `ΚΑΦΕΚΟΠΤΕΙΟ ΛΑΖΑΡΙΔΗ ΑΕ
ΑΦΜ 094000111
ΔΟΥ ΘΕΣΣΑΛΟΝΙΚΗΣ
ΤΙΜΟΛΟΓΙΟ ΠΩΛΗΣΗΣ ΑΡ. Α 4521
Ημερομηνία 10/09/2026
ΠΕΛΑΤΗΣ
ΔΟΣΗ COFFEE
Espresso blend  5  τεμ  0,60  3,00
Νερό φυσικό     12 τεμ  0,20  2,40
ΦΠΑ 13% 0,70
ΠΛΗΡΩΤΕΟ 5,40`;

  it("takes the supplier, not Dose the buyer", () => {
    const draft = parseInvoiceText(greek);
    assert.match(draft.vendor, /ΛΑΖΑΡΙΔΗ/);
    assert.doesNotMatch(draft.vendor, /ΔΟΣΗ/i);
    assert.equal(draft.invoiceNo, "Α 4521");
    assert.equal(draft.date, "2026-09-10");
    assert.equal(draft.total, 5.4);
    assert.equal(draft.items.length, 2);
    assert.equal(draft.items[0].qty, 5);
    assert.equal(draft.items[0].unitCost, 0.6);
    assert.equal(draft.items[1].name.includes("Νερό"), true);
  });

  it("joins a wrapped product name", () => {
    const draft = parseInvoiceText(`ΜΥΛΟΙ ΑΕ
Τιμολόγιο ΑΡ. 88
01.09.2026
Ψωμί ολικής
4  1,20  4,80
ΠΛΗΡΩΤΕΟ 4,80`);
    assert.equal(draft.items.length, 1);
    assert.match(draft.items[0].name, /Ψωμί/);
    assert.equal(draft.items[0].qty, 4);
    assert.equal(draft.items[0].unitCost, 1.2);
  });
});

describe("money and dates", () => {
  it("parses Greek thousands", () => {
    assert.equal(parseMoney("1.234,50"), 1234.5);
    assert.equal(parseMoney("12,40"), 12.4);
    assert.equal(parseMoney("€3.00"), 3);
  });

  it("normalizes dates", () => {
    assert.equal(normalizeInvoiceDate("10/09/2026"), "2026-09-10");
    assert.equal(normalizeInvoiceDate("2026-09-10"), "2026-09-10");
    assert.equal(normalizeInvoiceDate("10 Σεπτεμβρίου 2026"), "2026-09-10");
  });
});

describe("scan detection", () => {
  it("flags empty and garbage text layers", () => {
    assert.equal(isScannedPdfText("", 1), true);
    assert.equal(isScannedPdfText("abc def", 1), true);
    assert.equal(
      isScannedPdfText("KAFEKOPTEIO LAZARIDI\nTimologio AR 4521\nEspresso 5 0.60 3.00\nNero 12 0.20 2.40\nSYNOLA 5.40", 1),
      false,
    );
  });
});

describe("mergeDrafts", () => {
  it("fills holes and prefers the item set that matches the total", () => {
    const ai = {
      vendor: "ΔΟΣΗ",
      date: "10/09/2026",
      invoiceNo: "",
      total: 5.4,
      items: [{ name: "Espresso", qty: 1, unitCost: 5.4, productId: null }],
    };
    const heuristic = parseInvoiceText(`KAFEKOPTEIO LAZARIDI
Timologio AR 4521
10/09/2026
Espresso 5 0.60 3.00
Nero 12 0.20 2.40
SYNOLA 5.40`);
    const merged = mergeDrafts(ai, heuristic);
    assert.equal(merged.vendor, "KAFEKOPTEIO LAZARIDI");
    assert.equal(merged.invoiceNo, "AR 4521");
    assert.equal(merged.date, "2026-09-10");
    assert.equal(merged.items.length, 2);
    assert.equal(merged.total, 5.4);
  });

  it("keeps AI items when they already match", () => {
    const ai = draftFromModel({
      vendor: "ΜΥΛΟΙ",
      invoice_no: "99",
      date: "2026-01-02",
      total: 4,
      items: [{ name: "Ψωμί", qty: 2, unit_cost: 2 }],
    });
    const merged = mergeDrafts(ai, emptyDraft());
    assert.equal(merged.items[0].name, "Ψωμί");
    assert.equal(merged.total, 4);
  });
});
