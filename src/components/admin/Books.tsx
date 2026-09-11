import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { fileToJpeg } from "@/lib/image";
import { formatWhen, money } from "@/lib/format";
import {
  editExpense,
  getLedger,
  parseInvoice,
  removeExpense,
  saveExpense,
} from "@/lib/dose.functions";
import type { Expense, ExpenseLine, Ledger, PayKind } from "@/lib/ledger";
import { PAY_LABEL } from "@/lib/till";
import { useDose } from "@/lib/store";

const emptyLine = (): ExpenseLine => ({
  name: "",
  qty: 1,
  unitCost: 0,
  productId: null,
});

export function InvoicesPanel() {
  const pin = useDose((s) => s.pin);
  const products = useDose((s) => s.products);
  const applyCatalog = useDose((s) => s.applyCatalog);
  const showToast = useDose((s) => s.showToast);
  const router = useRouter();
  const [vendor, setVendor] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [items, setItems] = useState<ExpenseLine[]>([emptyLine()]);
  const [restock, setRestock] = useState(true);
  const [pay, setPay] = useState<PayKind>("cash");
  const [busy, setBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function refresh() {
    try {
      setLedger(await getLedger({ data: { pin } }));
    } catch {
      /* keep previous */
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function setLine(index: number, patch: Partial<ExpenseLine>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function guessProductId(name: string) {
    const n = name.trim().toLowerCase();
    if (!n) return null;
    return (
      products.find(
        (p) =>
          p.name.toLowerCase() === n ||
          p.name.toLowerCase().includes(n) ||
          n.includes(p.name.toLowerCase()),
      )?.id ?? null
    );
  }

  function resetForm() {
    setEditingId(null);
    setVendor("");
    setInvoiceNo("");
    setInvoiceDate("");
    setNote("");
    setPhoto("");
    setFileLabel("");
    setItems([emptyLine()]);
    setRestock(true);
    setPay("cash");
    setScanMsg("");
  }

  function loadExpense(e: Expense) {
    setEditingId(e.id);
    setVendor(e.vendor);
    setInvoiceNo(e.invoiceNo);
    setInvoiceDate(e.invoiceDate);
    setNote(e.note);
    setPhoto(e.photo);
    setFileLabel(e.photo ? "Συνημμένο" : "");
    setItems(e.items.length ? e.items.map((it) => ({ ...it })) : [emptyLine()]);
    setRestock(e.restocked);
    setPay(e.pay || "cash");
    setScanMsg("Επεξεργασία — άλλαξε γραμμές και αποθήκευσε.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function scan(file: File) {
    setBusy(true);
    setFileLabel(file.name);
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    setScanMsg(isPdf ? "Διαβάζω το PDF…" : "Διαβάζω την απόδειξη…");
    try {
      let image = "";
      let images: string[] = [];
      let text = "";
      let scanned = !isPdf;
      if (isPdf) {
        const { extractPdf } = await import("@/lib/pdf-browser");
        const extracted = await extractPdf(file);
        images = extracted.images;
        image = extracted.image;
        text = extracted.text;
        scanned = extracted.scanned;
        setPhoto(image);
        setScanMsg(
          extracted.scanned
            ? `Σαρωμένο PDF, ${extracted.pageCount} σελ. — καθαρίζω την εικόνα και διαβάζω με OCR…`
            : extracted.pageCount > 1
              ? `${extracted.pageCount} σελίδες — συμπληρώνω τις γραμμές…`
              : "Συμπληρώνω τις γραμμές…",
        );
      } else {
        image = await fileToJpeg(file, 1600);
        images = [image];
        setPhoto(image);
        setScanMsg("Καθαρίζω τη φωτογραφία και διαβάζω τις γραμμές…");
      }
      const draft = await parseInvoice({
        data: { pin, image, images, text, scanned },
      });
      setVendor(draft.vendor || vendor);
      if (draft.invoiceNo) setInvoiceNo(draft.invoiceNo);
      if (draft.date) setInvoiceDate(draft.date);
      if (draft.items.length) {
        setItems(
          draft.items.map((it) => ({
            ...it,
            qty: Number(it.qty),
            unitCost: Math.round(Number(it.unitCost) * 100) / 100,
            productId: it.productId || guessProductId(it.name),
          })),
        );
      }
      const who = draft.vendor ? ` · ${draft.vendor}` : "";
      setScanMsg(
        draft.items.length
          ? `Βρήκα ${draft.items.length} γραμμές${who}. Τσεκάρισε και αποθήκευσε.`
          : "Δεν βρήκα γραμμές — συμπλήρωσέ τις. Το αρχείο μένει συνημμένο.",
      );
    } catch (err) {
      setScanMsg(
        err instanceof Error ? err.message : "Πέρασε τις γραμμές με το χέρι.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const clean = items.filter((it) => it.name.trim() && it.qty > 0);
    if (!clean.length) return;
    setBusy(true);
    try {
      const payload = {
        pin,
        vendor,
        note,
        photo,
        invoiceNo,
        invoiceDate,
        restock,
        pay,
        items: clean,
      };
      const catalog = editingId
        ? await editExpense({ data: { ...payload, id: editingId } })
        : await saveExpense({ data: payload });
      applyCatalog(catalog.products, catalog.shop);
      await router.invalidate();
      resetForm();
      showToast(
        editingId
          ? "Το τιμολόγιο ενημερώθηκε"
          : pay === "cash"
            ? "Καταγράφηκε — βγήκε από το συρτάρι"
            : "Καταγράφηκε έξοδο",
      );
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Δεν αποθηκεύτηκε");
    } finally {
      setBusy(false);
    }
  }

  async function destroy(id: string) {
    setBusy(true);
    try {
      const catalog = await removeExpense({ data: { pin, id } });
      applyCatalog(catalog.products, catalog.shop);
      await router.invalidate();
      if (editingId === id) resetForm();
      setPendingDelete(null);
      showToast("Διαγράφηκε");
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Δεν διαγράφηκε");
    } finally {
      setBusy(false);
    }
  }

  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitCost) || 0), 0);

  return (
    <section className="mx-auto max-w-[980px] px-5 py-10">
      <p className="eyebrow">Αγορές</p>
      <h2 className="mb-2 font-display text-4xl">
        {editingId ? "Επεξεργασία." : "Τιμολόγια."}
      </h2>
      <p className="mb-6 text-sm text-muted">
        PDF, φωτογραφία ή σκανάρισμα. Διάλεξε αν πληρώθηκε από το συρτάρι, με
        κάρτα ή με έμβασμα — ώστε το ταμείο να ξέρει τι βγήκε.
      </p>

      <form
        className="mb-10 grid gap-3 border border-line bg-bg-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="grid gap-1.5 text-sm text-muted">
          PDF / φωτογραφία / σκανάρισμα
          <input
            className="field py-2"
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void scan(file);
            }}
          />
        </label>
        {fileLabel ? (
          <p className="text-xs text-muted">Αρχείο: {fileLabel}</p>
        ) : null}
        {photo ? (
          <img src={photo} alt="Τιμολόγιο" className="max-h-48 w-auto object-contain" />
        ) : null}
        {scanMsg ? <p className="text-sm text-cream-dim">{scanMsg}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm text-muted">
            Προμηθευτής
            <input
              className="field"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="π.χ. Καφεκοπτείο, ΜΥΛΟΙ"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-muted">
            Αριθμός τιμολογίου
            <input
              className="field"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="π.χ. Α 1234"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm text-muted">
            Ημερομηνία τιμολογίου
            <input
              className="field"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              placeholder="π.χ. 2026-09-10"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-muted">
            Πληρωμή
            <select
              className="field"
              value={pay}
              onChange={(e) => setPay(e.target.value as PayKind)}
            >
              <option value="cash">Μετρητά από το συρτάρι</option>
              <option value="card">Κάρτα / POS</option>
              <option value="transfer">Έμβασμα / πίστωση</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-sm text-muted">
          Σημείωση
          <input
            className="field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Προαιρετικά"
          />
        </label>

        <div className="grid gap-3">
          {items.map((it, i) => (
            <div key={i} className="grid gap-2 border border-line p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_5rem_7rem]">
                <input
                  className="field"
                  placeholder="Προϊόν αγοράς"
                  value={it.name}
                  onChange={(e) =>
                    setLine(i, {
                      name: e.target.value,
                      productId: guessProductId(e.target.value) ?? it.productId,
                    })
                  }
                />
                <input
                  className="field"
                  type="number"
                  min={0}
                  step="1"
                  placeholder="Ποσ."
                  value={it.qty || ""}
                  onChange={(e) => setLine(i, { qty: Number(e.target.value) })}
                />
                <input
                  className="field"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Κόστος"
                  value={it.unitCost || ""}
                  onChange={(e) =>
                    setLine(i, {
                      unitCost: Math.round(Number(e.target.value) * 100) / 100,
                    })
                  }
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <select
                  className="field"
                  value={it.productId ?? ""}
                  onChange={(e) =>
                    setLine(i, { productId: e.target.value || null })
                  }
                >
                  <option value="">Χωρίς σύνδεση στο κατάλογο</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · απόθεμα {p.stock}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="min-h-11 px-3 text-sm text-muted"
                  onClick={() =>
                    setItems((rows) =>
                      rows.length === 1 ? [emptyLine()] : rows.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  Αφαίρεση
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          onClick={() => setItems((rows) => [...rows, emptyLine()])}
        >
          Γραμμή ακόμα
        </Button>

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={restock}
            onChange={(e) => setRestock(e.target.checked)}
            className="accent-sage"
          />
          Πρόσθεσε τις ποσότητες στο απόθεμα όπου υπάρχει σύνδεση
        </label>

        <p className="text-sm">
          Σύνολο εξόδου <strong className="tabular-nums">{money(total)}</strong>
          {pay === "cash" ? " · βγαίνει από το συρτάρι" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || total <= 0}>
            {editingId ? "Ενημέρωση τιμολογίου" : "Αποθήκευση αγοράς"}
          </Button>
          {editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Άκυρο
            </Button>
          ) : null}
        </div>
      </form>

      {!ledger?.expenses.length ? (
        <p className="text-sm text-muted">Δεν υπάρχουν ακόμα τιμολόγια.</p>
      ) : (
        <div className="grid gap-3">
          {ledger.expenses.map((e) => (
            <article key={e.id} className="border border-line bg-bg-2 p-4">
              <header className="mb-2 flex flex-wrap justify-between gap-2">
                <strong>{e.vendor || "Αγορά"}</strong>
                <span className="tabular-nums text-sage">{money(e.total)}</span>
              </header>
              <p className="text-xs text-muted">
                {formatWhen(e.at)}
                {e.invoiceNo ? ` · ${e.invoiceNo}` : ""}
                {e.invoiceDate ? ` · ${e.invoiceDate}` : ""}
                {` · ${PAY_LABEL[e.pay] ?? e.pay}`}
                {e.restocked ? " · στο απόθεμα" : ""}
              </p>
              {e.note ? <p className="mt-1 text-sm text-muted">{e.note}</p> : null}
              <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                {e.items.map((it, i) => (
                  <li key={i}>
                    {it.name} ×{it.qty} — {money(it.unitCost * it.qty)}
                    {it.productId ? " · σύνδεση καταλόγου" : ""}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => loadExpense(e)}>
                  Επεξεργασία
                </Button>
                {pendingDelete === e.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void destroy(e.id)}
                  >
                    Σίγουρα διαγραφή;
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(e.id)}
                  >
                    Διαγραφή
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
