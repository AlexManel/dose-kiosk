import { Link, createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/site/Shell";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchBar } from "@/components/shop/SearchBar";
import { CATS, CAT_LABEL, matchesQuery, type CatFilter } from "@/lib/catalog";
import { cn } from "@/lib/cn";

const FILTERS = CATS;
const rootRoute = getRouteApi("__root__");

type ShopSearch = { cat?: CatFilter; q?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    const out: ShopSearch = {};
    const cat = search.cat;
    if (typeof cat === "string" && FILTERS.includes(cat as CatFilter) && cat !== "all") {
      out.cat = cat as CatFilter;
    }
    if (typeof search.q === "string" && search.q.trim()) {
      out.q = search.q.trim().slice(0, 80);
    }
    return out;
  },
  component: ShopPage,
  head: () => ({
    meta: [{ title: "Προϊόντα — Dose" }],
  }),
});

function ShopPage() {
  const { cat = "all", q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { products } = rootRoute.useLoaderData();
  const visible = products.filter(
    (p) => (cat === "all" || p.cat === cat) && matchesQuery(p, q),
  );

  function setQuery(next: string) {
    const trimmed = next.trim().slice(0, 80);
    void navigate({
      search: {
        ...(cat !== "all" ? { cat } : {}),
        ...(trimmed ? { q: trimmed } : {}),
      },
      replace: true,
    });
  }

  return (
    <Shell>
      <div className="mx-auto max-w-[1100px] px-5 py-10 md:px-8 md:py-14">
        <p className="eyebrow">Κατάλογος</p>
        <h1 className="mb-6 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]">
          Διάλεξε τη δόση σου.
        </h1>

        <div className="sticky top-[61px] z-20 -mx-5 mb-8 space-y-3 bg-bg/90 px-5 py-3 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
          <SearchBar value={q} onChange={setQuery} />
          <div role="tablist" className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {FILTERS.map((id) => (
              <Link
                key={id}
                to="/shop"
                search={{
                  ...(id === "all" ? {} : { cat: id }),
                  ...(q ? { q } : {}),
                }}
                role="tab"
                aria-selected={cat === id}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 py-2 text-sm",
                  cat === id
                    ? "border-cream bg-cream text-bg"
                    : "border-line bg-transparent text-muted hover:text-cream",
                )}
              >
                {CAT_LABEL[id]}
              </Link>
            ))}
          </div>
        </div>

        <p className="mb-5 text-sm text-muted">
          {visible.length === 1 ? "1 προϊόν" : `${visible.length} προϊόντα`}
          {q ? ` για «${q}»` : null}
        </p>

        {visible.length === 0 ? (
          <p className="py-16 text-muted">
            Δεν βρέθηκε προϊόν
            {q ? ` για «${q}»` : " σε αυτή την κατηγορία"}.
          </p>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
