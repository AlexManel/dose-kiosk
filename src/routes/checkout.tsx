import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Shell } from "@/components/site/Shell";
import { Button } from "@/components/ui/button";
import { PAY_LABEL, buildWhatsAppMessage, type Order, type PayMethod } from "@/lib/catalog";
import { recordSale } from "@/lib/dose.functions";
import { money } from "@/lib/format";
import { useCartMeta, useDose } from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [{ title: "Παράδοση — Dose" }],
  }),
});

function CheckoutPage() {
  const shop = useDose((s) => s.shop);
  const addOrder = useDose((s) => s.addOrder);
  const clearCart = useDose((s) => s.clearCart);
  const showToast = useDose((s) => s.showToast);
  const applyCatalog = useDose((s) => s.applyCatalog);
  const { items, totals, count } = useCartMeta();
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    floor: "",
    notes: "",
    pay: "cash" as PayMethod,
  });
  const [error, setError] = useState("");

  const belowMin = totals.sub < shop.minOrder;

  function field<K extends keyof typeof form>(key: K) {
    return {
      value: form[key],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (count === 0) {
      setError("Το καλάθι είναι άδειο.");
      return;
    }
    if (belowMin) {
      setError(`Ελάχιστη παραγγελία ${money(shop.minOrder)}.`);
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Όνομα, τηλέφωνο και διεύθυνση είναι απαραίτητα.");
      return;
    }

    const order: Order = {
      id: "o" + Date.now(),
      at: new Date().toISOString(),
      status: "νέα",
      items,
      data: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        floor: form.floor.trim(),
        notes: form.notes.trim(),
        pay: form.pay,
      },
      totals,
    };

    setSending(true);
    try {
      const catalog = await recordSale({
        data: {
          items: items.map((it) => ({ id: it.id, qty: it.qty })),
          channel: "delivery",
          pay: form.pay,
          fee: shop.deliveryFee,
        },
      });
      applyCatalog(catalog.products, catalog.shop);
      await router.invalidate();
    } catch (err) {
      setSending(false);
      setError(err instanceof Error ? err.message : "Δεν καταγράφηκε η πώληση.");
      return;
    }

    addOrder(order);
    clearCart();

    const phone = shop.whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(buildWhatsAppMessage(order));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    showToast("Η παραγγελία στάλθηκε");
    setSending(false);
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-16">
        <div>
          <p className="eyebrow">Παράδοση</p>
          <h1 className="mb-3 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]">
            Στο κατώφλι σου.
          </h1>
          <p className="text-muted">
            Συμπλήρωσε τα στοιχεία. Η παραγγελία ανοίγει WhatsApp με έτοιμο
            μήνυμα. Πληρωμή με μετρητά ή κάρτα στην παράδοση — χωρίς κάρτα
            online.
          </p>
          <ul className="mt-5 list-disc space-y-1 pl-5 text-muted">
            <li>Ελάχιστη παραγγελία {money(shop.minOrder)}</li>
            <li>Μεταφορικά {money(shop.deliveryFee)} εντός ζώνης</li>
            <li>Χρόνος παράδοσης 20–35 λεπτά</li>
          </ul>

          <div className="mt-8 border border-line bg-bg-2 p-4">
            <h2 className="mb-3 font-display text-2xl">Σύνοψη</h2>
            {count === 0 ? (
              <p className="text-sm text-muted">
                Το καλάθι είναι άδειο.{" "}
                <Link
                  to="/shop"
                  className="text-cream underline-offset-4 hover:underline"
                >
                  Δες τα προϊόντα
                </Link>
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span>
                      {it.name} ×{it.qty}
                    </span>
                    <span className="tabular-nums text-cream-dim">
                      {money(it.price * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm text-muted">
              <div className="flex justify-between">
                <span>Υποσύνολο</span>
                <span className="tabular-nums">{money(totals.sub)}</span>
              </div>
              <div className="flex justify-between">
                <span>Μεταφορικά</span>
                <span className="tabular-nums">{money(shop.deliveryFee)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base text-cream">
                <span>Σύνολο</span>
                <span className="tabular-nums">{money(totals.grand)}</span>
              </div>
            </div>
            {belowMin && count > 0 && (
              <p className="mt-3 text-sm text-danger">
                Χρειάζεσαι ακόμα {money(shop.minOrder - totals.sub)} για την
                ελάχιστη παραγγελία.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5 text-[13px] text-muted">
            Όνομα
            <input
              className="field"
              required
              autoComplete="name"
              placeholder="π.χ. Μαρία Κ."
              {...field("name")}
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Τηλέφωνο
            <input
              className="field"
              required
              type="tel"
              autoComplete="tel"
              placeholder="69xxxxxxxx"
              {...field("phone")}
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Διεύθυνση παράδοσης
            <input
              className="field"
              required
              autoComplete="street-address"
              placeholder="Οδός και αριθμός"
              {...field("address")}
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Όροφος / κουδούνι
            <input
              className="field"
              placeholder="π.χ. 2ος, κουδούνι Παπαδόπουλος"
              {...field("floor")}
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Σημείωση
            <textarea
              className="field min-h-20"
              rows={3}
              placeholder="Χωρίς ζάχαρη, αλλεργίες…"
              {...field("notes")}
            />
          </label>
          <fieldset className="grid gap-2 border-0 p-0">
            <legend className="mb-1 text-[13px] text-muted">Πληρωμή</legend>
            {(["cash", "card"] as PayMethod[]).map((p) => (
              <label
                key={p}
                className="flex min-h-11 items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="pay"
                  checked={form.pay === p}
                  onChange={() => setForm((f) => ({ ...f, pay: p }))}
                  className="accent-sage"
                />
                {PAY_LABEL[p]}
              </label>
            ))}
          </fieldset>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" size="full" disabled={count === 0 || belowMin || sending}>
            {sending ? "Καταγραφή…" : "Αποστολή στο WhatsApp"}
          </Button>
          <p className="text-xs text-muted">
            Η παραγγελία αποθηκεύεται και στο τηλέφωνό σου, για να τη βλέπεις
            από τη διαχείριση του μαγαζιού.
          </p>
        </form>
      </div>
    </Shell>
  );
}
