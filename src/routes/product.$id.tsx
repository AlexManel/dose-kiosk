import { useState } from "react";
import { Link, createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Shell } from "@/components/site/Shell";
import { ProductCard } from "@/components/product/ProductCard";
import { QtyControl } from "@/components/product/QtyControl";
import { Button } from "@/components/ui/button";
import { CAT_LABEL } from "@/lib/catalog";
import { money } from "@/lib/format";
import { useDose } from "@/lib/store";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { products } = rootRoute.useLoaderData();
  const addToCart = useDose((s) => s.addToCart);
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Δεν βρέθηκε.</h1>
          <p className="mt-3 text-muted">Αυτό το προϊόν δεν υπάρχει πια.</p>
          <Link
            to="/shop"
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-cream px-6 text-sm text-bg"
          >
            Πίσω στον κατάλογο
          </Link>
        </div>
      </Shell>
    );
  }

  const related = products
    .filter((p) => p.cat === product.cat && p.id !== product.id)
    .slice(0, 3);

  return (
    <Shell>
      <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-8 md:py-14">
        <Link
          to="/shop"
          search={{ cat: product.cat }}
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-cream"
        >
          <ArrowLeft className="size-4" />
          {CAT_LABEL[product.cat]}
        </Link>

        <div className="grid items-start gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
          <div className="overflow-hidden rounded-[var(--radius-md)] bg-white">
            {product.photo ? (
              <img
                src={product.photo}
                alt={product.name}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="grid aspect-square place-items-center bg-bg-2 text-muted">
                Χωρίς φωτογραφία
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">{CAT_LABEL[product.cat]}</p>
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05]">
              {product.name}
            </h1>
            <p className="mt-3 text-lg font-light text-muted">{product.desc}</p>
            <p className="mt-6 font-display text-4xl tabular-nums">
              {money(product.price)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {product.stock <= 0 ? (
                <p className="text-sm text-muted">Εξαντλήθηκε προς το παρόν.</p>
              ) : (
                <>
                  <QtyControl
                    value={qty}
                    onChange={(n) => setQty(Math.min(n, product.stock))}
                  />
                  <Button
                    onClick={() => addToCart(product.id, qty)}
                    className="min-w-44"
                  >
                    Προσθήκη στο καλάθι
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <p className="eyebrow">Σχετικά</p>
            <h2 className="mb-8 font-display text-3xl">Κι αυτά.</h2>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
