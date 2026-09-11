import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { downloadLedgerCsv, printDaySheet } from "@/lib/books-csv";
import { formatWhen, money } from "@/lib/format";
import { fileToJpeg } from "@/lib/image";
import {
  addTillMove,
  closeTill,
  getLedger,
  openTill,
  parseZReport,
  recordWalkIn,
  removeSale,
  removeTillMove,
  saveTillCheck,
} from "@/lib/dose.functions";
import type { Ledger, TillSnapshot } from "@/lib/ledger";
import {
  MOVE_REASONS_IN,
  MOVE_REASONS_OUT,
  checkRows,
  diffLabel,
} from "@/lib/till";
import { useDose } from "@/lib/store";
import { cn } from "@/lib/cn";

export function TillPanel() {
  const pin = useDose((s) => s.pin);
  const products = useDose((s) => s.products);
  const applyCatalog = useDose((s) => s.applyCatalog);
  const showToast = useDose((s) => s.showToast);
  const router = useRouter();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [error, setError] = useState("");
  const [walkId, setWalkId] = useState(products[0]?.id ?? "");
  const [walkQty, setWalkQty] = useState(1);
  const [walkPay, setWalkPay] = useState<"cash" | "card">("cash");
  const [busy, setBusy] = useState(false);
  const [pendingSale, setPendingSale] = useState<string | null>(null);
  const [openFloat, setOpenFloat] = useState(50);
  const [counted, setCounted] = useState("");
  const [moveKind, setMoveKind] = useState<"in" | "out">("out");
  const [moveAmt, setMoveAmt] = useState("");
  const [moveReason, setMoveReason] = useState<string>(MOVE_REASONS_OUT[0]);
  const [zCash, setZCash] = useState("");
  const [zCard, setZCard] = useState("");
  const [posCard, setPosCard] = useState("");
  const [scanMsg, setScanMsg] = useState("");
  const [zPhoto, setZPhoto] = useState("");
  const [posPhoto, setPosPhoto] = useState("");
  const [scanKind, setScanKind] = useState<"z" | "pos" | "">("");

  useEffect(() => {
    if (!walkId && products[0]) setWalkId(products[0].id);
  }, [products, walkId]);

  async function load() {
    try {
      const data = await getLedger({ data: { pin } });
      setLedger(data);
      setError("");
    } catch {
      setError("Δεν φόρτωσαν τα νούμερα.");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => {
    const c = ledger?.till.lastCheck;
    if (!c) {
      setZCash("");
      setZCard("");
      setPosCard("");
      setZPhoto("");
      setPosPhoto("");
      return;
    }
    if (c.zCash != null) setZCash(c.zCash.toFixed(2));
    if (c.zCard != null) setZCard(c.zCard.toFixed(2));
    if (c.posCard != null) setPosCard(c.posCard.toFixed(2));
    if (c.zPhoto) setZPhoto(c.zPhoto);
    if (c.posPhoto) setPosPhoto(c.posPhoto);
  }, [ledger?.till.session?.id, ledger?.till.lastCheck?.id]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await router.invalidate();
      showToast(ok);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Δεν έγινε");
    } finally {
      setBusy(false);
    }
  }

  async function scanReport(file: File, kind: "z" | "pos") {
    setBusy(true);
    setScanKind(kind);
    setScanMsg(kind === "z" ? "Διαβάζω το Z…" : "Διαβάζω το POS…");
    try {
      let image = "";
      let images: string[] = [];
      let text = "";
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let scanned = !isPdf;
      if (isPdf) {
        const { extractPdf } = await import("@/lib/pdf-browser");
        const extracted = await extractPdf(file);
        images = extracted.images;
        image = extracted.image;
        text = extracted.text;
        scanned = extracted.scanned;
      } else {
        image = await fileToJpeg(file, 1600);
        images = [image];
      }
      if (kind === "z") setZPhoto(image);
      else setPosPhoto(image);
      const draft = await parseZReport({
        data: { pin, kind, image, images, text, scanned },
      });
      let nextCash = zCash;
      let nextCard = zCard;
      let nextPos = posCard;
      if (kind === "z") {
        if (draft.cash != null) {
          nextCash = draft.cash.toFixed(2);
          setZCash(nextCash);
        }
        if (draft.card != null) {
          nextCard = draft.card.toFixed(2);
          setZCard(nextCard);
        }
      } else {
        const v = draft.card ?? draft.total;
        if (v != null) {
          nextPos = v.toFixed(2);
          setPosCard(nextPos);
        }
      }
      const parse = (v: string) => (v.trim() === "" ? null : Number(v));
      const found =
        (kind === "z" && (draft.cash != null || draft.card != null || draft.total != null)) ||
        (kind === "pos" && (draft.card != null || draft.total != null));
      if (found) {
        await saveTillCheck({
          data: {
            pin,
            zCash: parse(nextCash),
            zCard: parse(nextCard),
            posCard: parse(nextPos),
            note: file.name.slice(0, 80),
            zPhoto: kind === "z" ? image : zPhoto,
            posPhoto: kind === "pos" ? image : posPhoto,
          },
        });
        await load();
      }
      const bits = [
        kind === "z" && draft.cash != null ? `μετρητά ${money(draft.cash)}` : "",
        kind === "z" && draft.card != null ? `κάρτες ${money(draft.card)}` : "",
        kind === "pos" && (draft.card ?? draft.total) != null
          ? `παρτίδα ${money((draft.card ?? draft.total) as number)}`
          : "",
      ].filter(Boolean);
      setScanMsg(
        bits.length ? `Διάβασα ${bits.join(" · ")}.` : "Δεν βρήκα ποσά — γράψε τα.",
      );
      if (found) showToast("Συγκρίθηκε με το Dose");
    } catch (err) {
      setScanMsg(err instanceof Error ? err.message : "Πέρασε τα ποσά με το χέρι.");
    } finally {
      setScanKind("");
      setBusy(false);
    }
  }

  async function sellWalkIn() {
    if (!walkId) return;
    await run(async () => {
      const catalog = await recordWalkIn({
        data: { pin, items: [{ id: walkId, qty: walkQty }], pay: walkPay },
      });
      applyCatalog(catalog.products, catalog.shop);
      setWalkQty(1);
    }, walkPay === "cash" ? "Μπήκε στο συρτάρι" : "Καταγράφηκε στην κάρτα");
  }

  async function voidSale(id: string) {
    await run(async () => {
      const catalog = await removeSale({ data: { pin, id } });
      applyCatalog(catalog.products, catalog.shop);
      setPendingSale(null);
    }, "Ακυρώθηκε");
  }

  const selected = products.find((p) => p.id === walkId);
  const till = ledger?.till;
  const session = till?.session;
  const open = Boolean(session && !session.closed);
  const reasons = moveKind === "in" ? MOVE_REASONS_IN : MOVE_REASONS_OUT;

  return (
    <section className="mx-auto max-w-[720px] px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Συρτάρι</p>
          <h2 className="font-display text-4xl">Ταμείο.</h2>
        </div>
        {ledger ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => printDaySheet(ledger)}>
              Φύλλο
            </Button>
            <Button
              variant="ghost"
              onClick={() => downloadLedgerCsv(ledger)}
              disabled={!ledger.sales.length && !ledger.expenses.length}
            >
              CSV
            </Button>
          </div>
        ) : null}
      </div>

      {error ? <p className="mb-6 text-sm text-danger">{error}</p> : null}

      <div className="mb-6 border border-line bg-bg-2 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {open
            ? `Ανοιχτό · αρχικό ${money(session!.openFloat)}`
            : session
              ? "Κλεισμένη βάρδια"
              : "Κλειστό"}
        </p>
        <p
          className={cn(
            "mt-2 font-display text-5xl tabular-nums leading-none",
            till && till.variance != null && Math.abs(till.variance) > 0.04
              ? "text-danger"
              : "text-cream",
          )}
        >
          {till && session ? money(till.expectedCash) : "—"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {till
            ? `${money(till.cashSales)} μετρητά · ${money(till.cardSales)} κάρτα${
                ledger ? ` · κέρδος ${money(ledger.profit)}` : ""
              }`
            : "Άνοιξε βάρδια"}
        </p>
        {ledger?.lowStock.length ? (
          <p className="mt-2 text-sm text-danger">
            Τελειώνει: {ledger.lowStock.map((p) => `${p.name} (${p.stock})`).join(", ")}
          </p>
        ) : null}
      </div>

      {!open ? (
        <form
          className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => openTill({ data: { pin, openFloat, note: "" } }),
              "Το ταμείο άνοιξε",
            );
          }}
        >
          <label className="grid gap-1.5 text-sm text-muted">
            Αρχικό ποσό
            <input
              className="field"
              type="number"
              min={0}
              step="0.01"
              value={openFloat}
              onChange={(e) => setOpenFloat(Number(e.target.value) || 0)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            Άνοιγμα
          </Button>
        </form>
      ) : null}

      <div className="mb-6 grid gap-3 border border-line bg-bg-2 p-4 md:grid-cols-[1fr_5.5rem_8.5rem_auto] md:items-end">
        <label className="grid gap-1.5 text-sm text-muted">
          Πώληση
          <select
            className="field"
            value={walkId}
            onChange={(e) => setWalkId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm text-muted">
          Τμχ
          <input
            className="field"
            type="number"
            min={1}
            max={selected?.stock || 30}
            value={walkQty}
            onChange={(e) => setWalkQty(Number(e.target.value) || 1)}
          />
        </label>
        <label className="grid gap-1.5 text-sm text-muted">
          Πληρωμή
          <select
            className="field"
            value={walkPay}
            onChange={(e) => setWalkPay(e.target.value as "cash" | "card")}
          >
            <option value="cash">Μετρητά</option>
            <option value="card">Κάρτα</option>
          </select>
        </label>
        <Button onClick={() => void sellWalkIn()} disabled={busy || !walkId}>
          Καταγραφή
        </Button>
      </div>

      {open && till ? (
        <div className="mb-6 border border-line bg-bg-2 p-4">
          <p className="font-display text-2xl">Z και POS</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <UploadSlot
              title="Z ταμειακής"
              thumb={zPhoto}
              busy={busy}
              scanning={scanKind === "z"}
              onFile={(file) => void scanReport(file, "z")}
            />
            <UploadSlot
              title="Παρτίδα POS"
              thumb={posPhoto}
              busy={busy}
              scanning={scanKind === "pos"}
              onFile={(file) => void scanReport(file, "pos")}
            />
          </div>
          {scanMsg ? <p className="mt-3 text-sm text-cream-dim">{scanMsg}</p> : null}
          <CompareLines till={till} />
          <form
            className="mt-3 grid gap-2 sm:grid-cols-4 sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const parse = (v: string) => (v.trim() === "" ? null : Number(v));
              void run(async () => {
                await saveTillCheck({
                  data: {
                    pin,
                    zCash: parse(zCash),
                    zCard: parse(zCard),
                    posCard: parse(posCard),
                    note: "",
                    zPhoto,
                    posPhoto,
                  },
                });
              }, "Συγκρίθηκε");
            }}
          >
            <label className="grid gap-1 text-xs text-muted">
              Z μετρητά
              <input
                className="field"
                type="number"
                min={0}
                step="0.01"
                value={zCash}
                onChange={(e) => setZCash(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              Z κάρτες
              <input
                className="field"
                type="number"
                min={0}
                step="0.01"
                value={zCard}
                onChange={(e) => setZCard(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              POS
              <input
                className="field"
                type="number"
                min={0}
                step="0.01"
                value={posCard}
                onChange={(e) => setPosCard(e.target.value)}
              />
            </label>
            <Button type="submit" variant="ghost" disabled={busy}>
              Διόρθωση
            </Button>
          </form>
        </div>
      ) : null}

      {open && till ? (
        <div className="mb-6 grid gap-3">
          <form
            className="grid gap-2 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = Number(moveAmt);
              if (!amount) return;
              void run(async () => {
                await addTillMove({
                  data: { pin, kind: moveKind, amount, reason: moveReason },
                });
                setMoveAmt("");
              }, moveKind === "in" ? "Μπήκε" : "Βγήκε");
            }}
          >
            <label className="grid gap-1.5 text-sm text-muted">
              Κίνηση
              <select
                className="field"
                value={moveKind}
                onChange={(e) => {
                  const k = e.target.value as "in" | "out";
                  setMoveKind(k);
                  setMoveReason(k === "in" ? MOVE_REASONS_IN[0] : MOVE_REASONS_OUT[0]);
                }}
              >
                <option value="out">Έξοδος</option>
                <option value="in">Είσοδος</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              Ποσό
              <input
                className="field"
                type="number"
                min={0.01}
                step="0.01"
                value={moveAmt}
                onChange={(e) => setMoveAmt(e.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              Αιτία
              <select
                className="field"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="ghost" disabled={busy || !moveAmt}>
              OK
            </Button>
          </form>

          <form
            className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(counted);
              if (!Number.isFinite(n)) return;
              void run(async () => {
                await closeTill({ data: { pin, countedCash: n, note: "" } });
                setCounted("");
              }, "Κλείσιμο ημέρας");
            }}
          >
            <label className="grid gap-1.5 text-sm text-muted">
              Καταμέτρηση συρταριού
              <input
                className="field"
                type="number"
                min={0}
                step="0.01"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                placeholder={money(till.expectedCash)}
              />
            </label>
            <Button type="submit" disabled={busy || counted === ""}>
              Κλείσιμο
            </Button>
            {counted !== "" ? (
              <p className="text-sm text-muted sm:col-span-2">
                Διαφορά {money(Number(counted) - till.expectedCash)}
              </p>
            ) : null}
          </form>
        </div>
      ) : null}

      <h3 className="mb-3 font-display text-2xl">Σήμερα</h3>
      {!till?.events.length && !ledger?.sales.length ? (
        <p className="text-sm text-muted">Καμία κίνηση ακόμα.</p>
      ) : (
        <ul className="grid gap-2">
          {(till?.events ?? []).slice(0, 16).map((ev) => {
            const sale = ledger?.sales.find((s) => s.id === ev.id);
            const move = till?.moves.find((m) => m.id === ev.id);
            return (
              <li key={ev.id} className="flex items-start justify-between gap-3 border border-line bg-bg-2 p-3 text-sm">
                <div>
                  <p>
                    {ev.title}
                    <span
                      className={cn(
                        "ml-2 tabular-nums",
                        ev.cashDelta > 0 && "text-sage",
                        ev.cashDelta < 0 && "text-danger",
                      )}
                    >
                      {ev.cashDelta > 0 ? "+" : ev.cashDelta < 0 ? "−" : ""}
                      {money(Math.abs(ev.amount))}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {formatWhen(ev.at)} · {ev.detail}
                  </p>
                </div>
                <div className="shrink-0 text-xs">
                  {sale ? (
                    pendingSale === sale.id ? (
                      <button
                        type="button"
                        className="text-danger"
                        onClick={() => void voidSale(sale.id)}
                        disabled={busy}
                      >
                        Σίγουρα;
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-muted"
                        onClick={() => setPendingSale(sale.id)}
                      >
                        Ακύρωση
                      </button>
                    )
                  ) : null}
                  {open && move ? (
                    <button
                      type="button"
                      className="text-muted"
                      onClick={() =>
                        void run(
                          () => removeTillMove({ data: { pin, id: move.id } }),
                          "Διαγράφηκε",
                        )
                      }
                    >
                      Διαγραφή
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function UploadSlot({
  title,
  thumb,
  busy,
  scanning,
  onFile,
}: {
  title: string;
  thumb: string;
  busy: boolean;
  scanning: boolean;
  onFile: (file: File) => void;
}) {
  function take(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm">{title}</p>
      {thumb ? (
        <img src={thumb} alt="" className="max-h-24 w-full bg-bg object-contain" />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <label
          className={cn(
            "field relative flex cursor-pointer items-center justify-center",
            busy && "opacity-50",
          )}
        >
          Αρχείο
          <input
            type="file"
            accept="application/pdf,image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={busy}
            onChange={take}
          />
        </label>
        <label
          className={cn(
            "field relative flex cursor-pointer items-center justify-center",
            busy && "opacity-50",
          )}
        >
          Κάμερα
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={busy}
            onChange={take}
          />
        </label>
      </div>
      {scanning ? <p className="text-xs text-cream-dim">Διαβάζω…</p> : null}
    </div>
  );
}

function CompareLines({ till }: { till: TillSnapshot }) {
  const rows = checkRows(till);
  if (rows.every((r) => r.report == null)) return null;
  return (
    <ul className="mt-3 grid gap-1 text-sm">
      {rows.map((r) => (
        <li key={r.key} className="flex justify-between gap-3">
          <span className="text-muted">{r.label}</span>
          <span className="tabular-nums">
            {r.report == null ? "—" : money(r.report)}
            {r.diff != null ? (
              <span
                className={cn(
                  "ml-2",
                  Math.abs(r.diff) > 0.04 ? "text-danger" : "text-sage",
                )}
              >
                {diffLabel(r.diff)}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
