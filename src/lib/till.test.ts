import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkRows, expectedCash, round2 } from "./till.ts";
import type { TillSnapshot } from "./ledger.ts";

describe("till math", () => {
  it("counts the drawer: float + cash sales − cash spend ± moves", () => {
    assert.equal(
      expectedCash({
        openFloat: 50,
        cashSales: 12.4,
        cashSpend: 5.4,
        movesIn: 10,
        movesOut: 20,
      }),
      47,
    );
  });

  it("keeps cents", () => {
    assert.equal(round2(0.1 + 0.2), 0.3);
    assert.equal(
      expectedCash({
        openFloat: 0,
        cashSales: 1.1,
        cashSpend: 0.2,
        movesIn: 0,
        movesOut: 0,
      }),
      0.9,
    );
  });
});

describe("checkRows", () => {
  it("compares Z and POS against Dose sales", () => {
    const till = {
      cashSales: 43.6,
      cardSales: 1.8,
      zCashDiff: 0,
      zCardDiff: 0.2,
      posDiff: 0,
      lastCheck: {
        id: "z1",
        at: "",
        zCash: 43.6,
        zCard: 2,
        posCard: 1.8,
        note: "",
        zPhoto: "",
        posPhoto: "",
      },
    } as TillSnapshot;
    const rows = checkRows(till);
    assert.equal(rows[0].report, 43.6);
    assert.equal(rows[1].diff, 0.2);
    assert.equal(rows[2].dose, 1.8);
  });
});
