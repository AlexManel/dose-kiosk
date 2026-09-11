import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Brand } from "@/components/site/Brand";
import { Button } from "@/components/ui/button";
import { InvoicesPanel } from "@/components/admin/Books";
import { TillPanel } from "@/components/admin/Till";
import { fileToJpeg } from "@/lib/image";
import {
  CAT_LABEL,
  DEFAULT_PIN,
  matchesQuery,
  type Product,
  type ProductCat,
} from "@/lib/catalog";
import { formatWhen, money } from "@/lib/format";
import { useDose } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Διαχείριση — Dose" }],
  }),
});

type Tab = "till" | "orders" | "products" | "invoices" | "settings";

function AdminPage() {
  const hydrate = useDose((s) => s.hydrate);
  const hydrated = useDose((s) => s.hydrated);
  const authed = useDose((s) => s.authed);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        Φόρτωση…
      </div>
    );
  }

  if (!authed) return <LockScreen />;
  return <Dashboard />;
}

function LockScreen() {
  const login = useDose((s) => s.login);
  const showToast = useDose((s) => s.showToast);
  const [code, setCode] = useState("");

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-[420px] border border-line bg-bg-2 px-6 py-8 text-center">
        <p className="eyebrow">Dose</p>
        <h1 className="font-display text-[2.6rem] leading-none">Dashboard</h1>
        <p className="mt-3 text-sm text-muted">
          Κωδικός για το μαγαζί. Προεπιλογή: <code className="text-cream-dim">dose</code>
        </p>
        <form
          className="mt-5 grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await login(code);
            if (!ok) showToast("Λάθος κωδικός");
          }}
        >
          <input
            type="password"
            className="field text-center"
            placeholder="Κωδικός"
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" size="full">
            Είσοδος
          </Button>
        </form>
        <Link to="/" className="mt-6 inline-block text-sm text-muted hover:text-cream">
          Πίσω στη σελίδα
        </Link>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>("till");
  const logout = useDose((s) => s.logout);
  const orders = useDose((s) => s.orders);
  const newCount = orders.filter((o) => o.status === "νέα").length;

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-line">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 md:px-6">
          <Brand to="/" sub="Dashboard" />
          <div className="ml-auto flex gap-2">
            <Link
              to="/"
              className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm"
            >
              Στη σελίδα
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm text-muted"
            >
              Έξοδος
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 px-4 pb-3 md:px-6">
          {(
            [
              ["till", "Ταμείο"],
              ["orders", `Παραγγελίες${newCount ? ` (${newCount})` : ""}`],
              ["products", "Προϊόντα"],
              ["invoices", "Τιμολόγια"],
              ["settings", "Ρυθμίσεις"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm",
                tab === id
                  ? "border-cream bg-cream text-bg"
                  : "border-line text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "till" && <TillPanel />}
      {tab === "orders" && <OrdersPanel />}
      {tab === "products" && <ProductsPanel />}
      {tab === "invoices" && <InvoicesPanel />}
      {tab === "settings" && <SettingsPanel />}
    </div>
  );
}

function OrdersPanel() {
  const orders = useDose((s) => s.orders);
  const setOrderStatus = useDose((s) => s.setOrderStatus);

  return (
    <section className="mx-auto max-w-[980px] px-5 py-10">
      <p className="eyebrow">Παραγγελίες</p>
      <h2 className="mb-6 font-display text-4xl">Τι ήρθε.</h2>
      {orders.length === 0 ? (
        <p className="text-muted">
          Οι ζωντανές παραγγελίες έρχονται στο WhatsApp. Εδώ φαίνονται μόνο όσες
          έγιναν από αυτό το τηλέφωνο.
        </p>
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <article key={o.id} className="border border-line bg-bg-2 p-4">
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <strong>{o.data.name}</strong>
                <span className="text-xs uppercase tracking-wide text-sage">
                  {o.status} · {formatWhen(o.at)}
                </span>
              </header>
              <p className="text-sm text-muted">
                {o.data.phone} · {o.data.address}
                {o.data.floor ? ` · ${o.data.floor}` : ""}
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.name} ×{it.qty} — {money(it.price * it.qty)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                Σύνολο {money(o.totals.grand)} ·{" "}
                {o.data.pay === "card" ? "Κάρτα στην παράδοση" : "Μετρητά"}
              </p>
              {o.data.notes ? (
                <p className="mt-1 text-sm text-muted">Σημείωση: {o.data.notes}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOrderStatus(o.id, "έγινε")}
                >
                  Έγινε
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOrderStatus(o.id, "ακυρώθηκε")}
                >
                  Ακύρωση
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const emptyProduct: Product = {
  id: "",
  name: "",
  desc: "",
  price: 0,
  cat: "coffee",
  photo: "",
  stock: 24,
};

async function fileToData(file: File): Promise<string> {
  return fileToJpeg(file, 720);
}

function ProductsPanel() {
  const products = useDose((s) => s.products);
  const upsertProduct = useDose((s) => s.upsertProduct);
  const deleteProduct = useDose((s) => s.deleteProduct);
  const showToast = useDose((s) => s.showToast);
  const router = useRouter();
  const [form, setForm] = useState<Product>(emptyProduct);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const editing = Boolean(form.id && products.some((p) => p.id === form.id));
  const visible = products.filter((p) => matchesQuery(p, q));

  return (
    <section className="mx-auto max-w-[980px] px-5 py-10">
      <p className="eyebrow">Κατάλογος</p>
      <h2 className="mb-2 font-display text-4xl">Προϊόντα.</h2>
      <p className="mb-6 text-sm text-muted">
        Ό,τι αποθηκεύεις εδώ το βλέπουν όλοι οι πελάτες.
      </p>

      <form
        className="mb-8 grid gap-3 border border-line bg-bg-2 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const item: Product = {
            ...form,
            id: form.id || "p" + Date.now(),
            name: form.name.trim(),
            desc: form.desc.trim(),
            price: Number(form.price),
          };
          if (!item.name || Number.isNaN(item.price)) return;
          setBusy(true);
          try {
            await upsertProduct(item);
            await router.invalidate();
            setForm(emptyProduct);
            showToast("Αποθηκεύτηκε — το βλέπουν όλοι");
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Δεν αποθηκεύτηκε.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="grid gap-1.5 text-[13px] text-muted">
          Όνομα
          <input
            className="field"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="π.χ. Freddo espresso"
          />
        </label>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Περιγραφή
          <input
            className="field"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            placeholder="Σύντομα"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-[13px] text-muted">
            Τιμή (€)
            <input
              className="field"
              type="number"
              min={0}
              step="0.10"
              required
              value={form.price || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: Number(e.target.value) }))
              }
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Απόθεμα
            <input
              className="field"
              type="number"
              min={0}
              step="1"
              required
              value={form.stock}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock: Number(e.target.value) }))
              }
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Κατηγορία
            <select
              className="field"
              value={form.cat}
              onChange={(e) =>
                setForm((f) => ({ ...f, cat: e.target.value as ProductCat }))
              }
            >
              <option value="coffee">Καφέδες</option>
              <option value="bread">Ψωμιά</option>
              <option value="drinks">Αναψυκτικά</option>
              <option value="juice">Χυμοί</option>
              <option value="energy">Energy</option>
              <option value="snacks">Σνακ</option>
              <option value="market">Ψιλικά</option>
              <option value="smokes">Τσιγάρα</option>
              <option value="heat">Ατμίσματα</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Διαδρομή φωτογραφίας
          <input
            className="field"
            value={form.photo.startsWith("data:") ? "" : form.photo}
            onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
            placeholder="/images/products/espresso.jpg"
          />
        </label>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Ή ανέβασε φωτογραφία
          <input
            className="field py-2"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const photo = await fileToData(file);
              setForm((f) => ({ ...f, photo }));
            }}
          />
        </label>
        {form.photo ? (
          <img
            src={form.photo}
            alt=""
            className="h-28 w-28 bg-white object-contain"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {editing ? "Ενημέρωση" : "Αποθήκευση προϊόντος"}
          </Button>
          {editing && (
            <Button
              variant="ghost"
              onClick={() => setForm(emptyProduct)}
            >
              Άκυρο
            </Button>
          )}
        </div>
      </form>

      <input
        className="field mb-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Αναζήτηση στον κατάλογο…"
      />

      <div className="grid gap-2.5">
        {visible.map((p) => (
          <article
            key={p.id}
            className="grid grid-cols-[56px_1fr] items-center gap-3 border border-line bg-bg-2 p-3 sm:grid-cols-[64px_1fr_auto]"
          >
            {p.photo ? (
              <img src={p.photo} alt="" className="size-14 bg-white object-contain sm:size-16" />
            ) : (
              <div className="size-14 bg-bg-3 sm:size-16" />
            )}
            <div className="min-w-0">
              <h4 className="truncate font-medium">
                {p.name} · {money(p.price)}
              </h4>
              <p className="truncate text-[13px] text-muted">
                {CAT_LABEL[p.cat]} — απόθεμα {p.stock}
                {p.desc ? ` — ${p.desc}` : ""}
              </p>
            </div>
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <Button variant="ghost" size="sm" onClick={() => setForm(p)}>
                Επεξεργασία
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await deleteProduct(p.id);
                    await router.invalidate();
                    showToast("Διαγράφηκε");
                  } catch {
                    showToast("Δεν διαγράφηκε.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Διαγραφή
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel() {
  const shop = useDose((s) => s.shop);
  const saveShop = useDose((s) => s.saveShop);
  const showToast = useDose((s) => s.showToast);
  const router = useRouter();
  const [form, setForm] = useState(shop);
  const [pin, setPinField] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(shop);
  }, [shop]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(shop) || pin.length > 0,
    [form, shop, pin],
  );

  return (
    <section className="mx-auto max-w-[980px] px-5 py-10">
      <p className="eyebrow">Κατάστημα</p>
      <h2 className="mb-6 font-display text-4xl">Ρυθμίσεις.</h2>
      <form
        className="grid gap-3 border border-line bg-bg-2 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await saveShop(
              {
                ...form,
                whatsapp: form.whatsapp.replace(/\D/g, ""),
                phone: form.phone.replace(/\D/g, ""),
                minOrder: Number(form.minOrder),
                deliveryFee: Number(form.deliveryFee),
              },
              pin.trim() || undefined,
            );
            await router.invalidate();
            setPinField("");
            showToast("Οι ρυθμίσεις αποθηκεύτηκαν");
          } catch {
            showToast("Δεν αποθηκεύτηκαν.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="grid gap-1.5 text-[13px] text-muted">
          WhatsApp (30…)
          <input
            className="field"
            required
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
          />
        </label>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Τηλέφωνο κλήσης
          <input
            className="field"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Διεύθυνση
          <input
            className="field"
            value={form.addressLine}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine: e.target.value }))
            }
          />
        </label>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Πόλη
          <input
            className="field"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[13px] text-muted">
            Ώρες
            <input
              className="field"
              value={form.hours}
              onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Σημείωση ωρών
            <input
              className="field"
              value={form.hoursNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, hoursNote: e.target.value }))
              }
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[13px] text-muted">
            Ελάχιστη παραγγελία (€)
            <input
              className="field"
              type="number"
              step="0.10"
              value={form.minOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))
              }
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-muted">
            Μεταφορικά (€)
            <input
              className="field"
              type="number"
              step="0.10"
              value={form.deliveryFee}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryFee: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-[13px] text-muted">
          Νέος κωδικός dashboard
          <input
            className="field"
            type="password"
            value={pin}
            placeholder={`Άφησέ το κενό — τώρα είναι «${DEFAULT_PIN}» αν δεν άλλαξε`}
            onChange={(e) => setPinField(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={!dirty || busy}>
          Αποθήκευση
        </Button>
      </form>
    </section>
  );
}
