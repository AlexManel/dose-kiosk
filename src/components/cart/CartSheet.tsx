import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { money } from "@/lib/format";
import { useCartMeta, useDose } from "@/lib/store";
import { cn } from "@/lib/cn";

export function CartSheet() {
  const open = useDose((s) => s.cartOpen);
  const setCartOpen = useDose((s) => s.setCartOpen);
  const setQty = useDose((s) => s.setQty);
  const shop = useDose((s) => s.shop);
  const { items, totals, count } = useCartMeta();

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        onClick={() => setCartOpen(false)}
        aria-label="Κλείσιμο καλαθιού"
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line bg-bg-2 shadow-[var(--shadow-panel)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between px-5 py-5">
          <h3 className="font-display text-[1.75rem]">Η παραγγελία σου</h3>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="grid size-11 place-items-center text-cream"
            aria-label="Κλείσιμο"
          >
            <X className="size-6" strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-5 pb-4">
          {count === 0 ? (
            <p className="py-8 text-muted">Το καλάθι είναι άδειο.</p>
          ) : (
            <ul>
              {items.map((it) => (
                <li
                  key={it.id}
                  className="grid grid-cols-[1fr_auto] gap-2 border-b border-line py-3"
                >
                  <div>
                    <p className="text-sm">{it.name}</p>
                    <p className="text-sm tabular-nums text-cream-dim">
                      {money(it.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-full border border-line text-cream"
                      onClick={() => setQty(it.id, it.qty - 1)}
                      aria-label="Λιγότερο"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm tabular-nums">
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-full border border-line text-cream"
                      onClick={() => setQty(it.id, it.qty + 1)}
                      aria-label="Περισσότερο"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {count > 0 && (
            <div className="mt-4 space-y-1.5 text-sm text-muted">
              <div className="flex justify-between">
                <span>Υποσύνολο</span>
                <span className="tabular-nums">{money(totals.sub)}</span>
              </div>
              <div className="flex justify-between">
                <span>Μεταφορικά</span>
                <span className="tabular-nums">{money(shop.deliveryFee)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg text-cream">
                <span>Σύνολο</span>
                <span className="tabular-nums">{money(totals.grand)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line p-5">
          <Link
            to="/checkout"
            onClick={() => setCartOpen(false)}
            className={cn(
              "inline-flex h-12 w-full min-h-12 items-center justify-center rounded-full bg-cream text-sm text-bg",
              count === 0 && "pointer-events-none opacity-40",
            )}
          >
            Ολοκλήρωση παραγγελίας
          </Link>
        </div>
      </aside>
    </div>
  );
}
