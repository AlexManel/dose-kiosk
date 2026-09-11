import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { money } from "@/lib/format";
import { useDose } from "@/lib/store";
import type { Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useDose((s) => s.addToCart);
  const soldOut = product.stock <= 0;

  return (
    <article className="group overflow-hidden rounded-[var(--radius-md)] border border-line bg-bg-2 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block"
      >
        <div className="relative aspect-square overflow-hidden bg-white">
          {product.photo ? (
            <img
              src={product.photo}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">
              Χωρίς φωτογραφία
            </div>
          )}
          {soldOut ? (
            <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-3 py-1 text-xs uppercase tracking-wide">
              Εξαντλήθηκε
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex items-end gap-3 p-4">
        <div className="min-w-0 flex-1">
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="block"
          >
            <h3 className="truncate font-sans text-base font-medium">{product.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-[13px] font-light text-muted">
              {product.desc}
            </p>
          </Link>
          <p className="mt-2 tabular-nums text-cream-dim">{money(product.price)}</p>
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => addToCart(product.id)}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-cream text-cream transition-colors duration-150 hover:bg-cream hover:text-bg disabled:opacity-40"
          aria-label={`Προσθήκη ${product.name}`}
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}
