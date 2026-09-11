import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeZDrafts, parseZText } from "./z-parse.ts";

const Z = `ΕΚΘΕΣΗ Ζ
ΗΜΕΡΟΜΗΝΙΑ 10/09/2026
ΜΕΤΡΗΤΑ 125,40
ΚΑΡΤΕΣ 84,20
ΓΕΝΙΚΟ ΣΥΝΟΛΟ 209,60
ΑΠΟΔΕΙΞΕΙΣ 47`;

const POS = `VIVA WALLET
SETTLEMENT / ΠΑΡΤΙΔΑ
10.09.2026
ΣΥΝΟΛΟ ΠΑΡΤΙΔΑΣ 84,20
ΣΥΝΑΛΛΑΓΕΣ 22`;

describe("parseZText", () => {
  it("reads a Greek Z report", () => {
    const d = parseZText(Z, "z");
    assert.equal(d.kind, "z");
    assert.equal(d.cash, 125.4);
    assert.equal(d.card, 84.2);
    assert.equal(d.total, 209.6);
    assert.equal(d.receipts, 47);
    assert.equal(d.date, "2026-09-10");
  });

  it("reads a POS settlement as cards only", () => {
    const d = parseZText(POS, "pos");
    assert.equal(d.kind, "pos");
    assert.equal(d.cash, null);
    assert.equal(d.card, 84.2);
    assert.equal(d.receipts, 22);
  });

  it("reads latin Z labels from a digital print", () => {
    const d = parseZText(
      "EKTHESI Z\nMETRITA 12.50\nKARTES 8.00\nSYNOLA HMERAS 20.50",
      "z",
    );
    assert.equal(d.cash, 12.5);
    assert.equal(d.card, 8);
  });

  it("reads amounts on the next line (thermal Z)", () => {
    const d = parseZText(
      `ΕΚΘΕΣΗ Ζ
10/09/2026
ΜΕΤΡΗΤΑ
  125,40
ΚΑΡΤΕΣ
  84,20
ΓΕΝΙΚΟ ΣΥΝΟΛΟ
  209,60
ΑΠΟΔΕΙΞΕΙΣ
  47`,
      "z",
    );
    assert.equal(d.cash, 125.4);
    assert.equal(d.card, 84.2);
    assert.equal(d.total, 209.6);
    assert.equal(d.receipts, 47);
  });

  it("ignores VAT and the opening float", () => {
    const d = parseZText(
      `ΑΡΧΙΚΟ ΤΑΜΕΙΟ 50,00
ΦΠΑ 24% 40,58
ΜΕΤΡΗΤΑ ΠΩΛΗΣΕΩΝ 125,40
ΚΑΡΤΕΣ 84,20
ΣΥΝΟΛΟ ΦΠΑ 40,58
ΓΕΝΙΚΟ ΣΥΝΟΛΟ 209,60`,
      "z",
    );
    assert.equal(d.cash, 125.4);
    assert.equal(d.card, 84.2);
    assert.equal(d.total, 209.6);
  });

  it("prefers POS gross over net", () => {
    const d = parseZText(
      `CARDLink
ΠΑΡΤΙΔΑ 10.09.2026
GROSS 84,20
NET 82,51
ΣΥΝΑΛΛΑΓΕΣ 22`,
      "pos",
    );
    assert.equal(d.card, 84.2);
    assert.equal(d.cash, null);
  });

  it("reads ICS-style ΜΕΤΡΗΤΟΙΣ / ΚΑΡΤΑ", () => {
    const d = parseZText(
      `ΗΜΕΡΗΣΙΑ ΑΝΑΦΟΡΑ Ζ
10-09-2026
ΜΕΤΡΗΤΟΙΣ 98,00
ΚΑΡΤΑ 41,50
ΣΥΝΟΛΟ ΠΩΛΗΣΕΩΝ 139,50
ΠΛΗΘΟΣ 31`,
      "z",
    );
    assert.equal(d.cash, 98);
    assert.equal(d.card, 41.5);
    assert.equal(d.total, 139.5);
    assert.equal(d.receipts, 31);
  });

  it("does not treat the report date as a POS total", () => {
    const d = parseZText(
      `VIVA WALLET
SETTLEMENT / PARTIDA
10.09.2026
GROSS 84,20
NET 82,51
SYNALLAGES 22`,
      "pos",
    );
    assert.equal(d.card, 84.2);
    assert.equal(d.cash, null);
    assert.equal(d.receipts, 22);
    assert.equal(d.date, "2026-09-10");
  });

  it("reads labels with a blank line before the amount", () => {
    const d = parseZText(
      `EKTHESI Z
METRITA

125.40
KARTES

84.20
SYNOLA HMERAS

209.60
APODEIXEIS

47`,
      "z",
    );
    assert.equal(d.cash, 125.4);
    assert.equal(d.card, 84.2);
    assert.equal(d.total, 209.6);
    assert.equal(d.receipts, 47);
  });
});

describe("mergeZDrafts", () => {
  it("fills holes from the heuristic", () => {
    const m = mergeZDrafts(
      { kind: "z", cash: null, card: 84.2, total: null, receipts: null, date: "" },
      parseZText(Z, "z"),
    );
    assert.equal(m.cash, 125.4);
    assert.equal(m.card, 84.2);
    assert.equal(m.date, "2026-09-10");
    assert.equal(m.total, 209.6);
  });
});
