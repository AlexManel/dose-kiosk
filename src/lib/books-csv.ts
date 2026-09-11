import { formatWhen, money } from "@/lib/format";
import type { Ledger } from "@/lib/ledger";
import { PAY_LABEL } from "@/lib/till";

function cell(value: string | number) {
  const s = String(value).replaceAll('"', '""');
  return /[;"\n]/.test(s) ? `"${s}"` : s;
}

function when(iso: string) {
  try {
    return new Date(iso).toLocaleString("el-GR");
  } catch {
    return iso;
  }
}

export function ledgerToCsv(ledger: Ledger) {
  const rows: string[] = [];
  const t = ledger.till;
  rows.push("ΤΑΜΕΙΟ");
  if (t.session) {
    rows.push(["Άνοιγμα", when(t.session.openedAt)].map(cell).join(";"));
    rows.push(["Αρχικό", t.session.openFloat.toFixed(2).replace(".", ",")].map(cell).join(";"));
    rows.push(["Αναμενόμενα μετρητά", t.expectedCash.toFixed(2).replace(".", ",")].map(cell).join(";"));
    rows.push(["Πωλήσεις μετρητά", t.cashSales.toFixed(2).replace(".", ",")].map(cell).join(";"));
    rows.push(["Πωλήσεις κάρτα", t.cardSales.toFixed(2).replace(".", ",")].map(cell).join(";"));
    if (t.variance != null) {
      rows.push(["Διαφορά συρταριού", t.variance.toFixed(2).replace(".", ",")].map(cell).join(";"));
    }
  }
  rows.push("");
  rows.push("ΕΣΟΔΑ");
  rows.push(
    ["Ημερομηνία", "Κανάλι", "Πληρωμή", "Είδη", "Υποσύνολο", "Μεταφορικά", "Σύνολο"]
      .map(cell)
      .join(";"),
  );
  for (const s of ledger.sales) {
    rows.push(
      [
        when(s.at),
        s.channel === "walkin" ? "Ταμείο" : "Delivery",
        s.pay === "card" ? "Κάρτα" : "Μετρητά",
        s.items.map((it) => `${it.name} x${it.qty}`).join(" | "),
        s.sub.toFixed(2).replace(".", ","),
        s.fee.toFixed(2).replace(".", ","),
        s.grand.toFixed(2).replace(".", ","),
      ]
        .map(cell)
        .join(";"),
    );
  }
  rows.push("");
  rows.push("ΕΞΟΔΑ");
  rows.push(
    ["Ημερομηνία", "Προμηθευτής", "Αριθμός", "Ημ. τιμολογίου", "Πληρωμή", "Είδη", "Σύνολο"]
      .map(cell)
      .join(";"),
  );
  for (const e of ledger.expenses) {
    rows.push(
      [
        when(e.at),
        e.vendor,
        e.invoiceNo,
        e.invoiceDate,
        PAY_LABEL[e.pay] ?? e.pay,
        e.items.map((it) => `${it.name} x${it.qty}`).join(" | "),
        e.total.toFixed(2).replace(".", ","),
      ]
        .map(cell)
        .join(";"),
    );
  }
  rows.push("");
  rows.push(["Έσοδα", ledger.income.toFixed(2).replace(".", ",")].map(cell).join(";"));
  rows.push(["Έξοδα", ledger.spend.toFixed(2).replace(".", ",")].map(cell).join(";"));
  rows.push(["Καθαρό κέρδος", ledger.profit.toFixed(2).replace(".", ",")].map(cell).join(";"));
  return "\uFEFF" + rows.join("\n");
}

export function downloadLedgerCsv(ledger: Ledger) {
  const blob = new Blob([ledgerToCsv(ledger)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dose-biblio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function line(label: string, value: string) {
  return `<tr><td>${label}</td><td class="n">${value}</td></tr>`;
}

export function printDaySheet(ledger: Ledger) {
  const t = ledger.till;
  const s = t.session;
  const title = s
    ? `Φύλλο ημέρας — ${new Date(s.openedAt).toLocaleDateString("el-GR")}`
    : "Φύλλο ταμείου";
  const html = `<!doctype html>
<html lang="el"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font: 14px/1.45 Georgia, serif; color: #111; margin: 28px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  p, td { font-family: ui-sans-serif, system-ui, sans-serif; }
  .muted { color: #555; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
  td { padding: 6px 0; border-bottom: 1px solid #ddd; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; }
  h2 { font-size: 13px; letter-spacing: .16em; text-transform: uppercase; margin: 22px 0 8px; }
</style></head><body>
<h1>Dose — ${title}</h1>
<p class="muted">${s ? `Άνοιγμα ${formatWhen(s.openedAt)} · αρχικό ${money(s.openFloat)}` : "Δεν υπάρχει ανοιχτό ταμείο."}</p>
<h2>Συρτάρι</h2>
<table>
${line("Αρχικό ποσό", money(s?.openFloat ?? 0))}
${line("Πωλήσεις μετρητοίς", money(t.cashSales))}
${line("Πωλήσεις κάρτας", money(t.cardSales))}
${line("Έξοδα μετρητοίς", money(t.cashSpend))}
${line("Καταθέσεις στο συρτάρι", money(t.movesIn))}
${line("Αναλήψεις", money(t.movesOut))}
${line("Αναμενόμενα μετρητά", money(t.expectedCash))}
${line("Καταμέτρηση", s?.countedCash != null ? money(s.countedCash) : "—")}
${line("Διαφορά συρταριού", t.variance == null ? "—" : money(t.variance))}
</table>
<h2>Ταμειακή / POS</h2>
<table>
${line("Z μετρητά (ταμειακή)", t.lastCheck?.zCash != null ? money(t.lastCheck.zCash) : "—")}
${line("Z κάρτες (ταμειακή)", t.lastCheck?.zCard != null ? money(t.lastCheck.zCard) : "—")}
${line("Παρτίδα POS", t.lastCheck?.posCard != null ? money(t.lastCheck.posCard) : "—")}
${line("Z μετρητά vs Dose", t.zCashDiff == null ? "—" : money(t.zCashDiff))}
${line("Z κάρτες vs Dose", t.zCardDiff == null ? "—" : money(t.zCardDiff))}
${line("Παρτίδα POS vs Dose", t.posDiff == null ? "—" : money(t.posDiff))}
</table>
<h2>Βιβλίο</h2>
<table>
${line("Έσοδα", money(ledger.income))}
${line("Έξοδα", money(ledger.spend))}
${line("Καθαρό κέρδος", money(ledger.profit))}
</table>
<p class="muted">Η ταμειακή βγάζει τη νόμιμη απόδειξη. Το Dose κρατά συρτάρι, απόθεμα και βιβλίο.</p>
</body></html>`;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
