import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Brand } from "./Brand";
import { useCartMeta, useDose } from "@/lib/store";

export function Header({
  showCart = true,
  home = false,
}: {
  showCart?: boolean;
  home?: boolean;
}) {
  const { count } = useCartMeta();
  const setCartOpen = useDose((s) => s.setCartOpen);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/86 px-5 py-3.5 backdrop-blur-md md:gap-5 md:px-7">
      <Brand to="/" onSecret={() => navigate({ to: "/admin" })} />
      <HeaderSearch />
      <nav className="ml-auto hidden items-center gap-6 text-sm text-muted md:flex">
        {home ? (
          <>
            <a href="#about" className="hover:text-cream">
              Το μαγαζί
            </a>
            <Link to="/shop" className="hover:text-cream">
              Προϊόντα
            </Link>
            <a href="#visit" className="hover:text-cream">
              Τοποθεσία
            </a>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-cream">
              Αρχική
            </Link>
            <Link to="/shop" className="hover:text-cream">
              Προϊόντα
            </Link>
          </>
        )}
      </nav>
      <Link
        to="/shop"
        className="ml-auto grid size-11 shrink-0 place-items-center text-cream md:hidden"
        aria-label="Αναζήτηση προϊόντων"
      >
        <Search className="size-5" strokeWidth={1.75} />
      </Link>
      {showCart ? (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-3.5 text-[13px] tracking-wide text-cream md:ml-0"
          aria-label={`Καλάθι, ${count} προϊόντα`}
        >
          Καλάθι
          <span className="grid size-5 place-items-center rounded-full bg-cream text-[11px] font-semibold tabular-nums text-bg">
            {count}
          </span>
        </button>
      ) : (
        <Link
          to="/shop"
          className="hidden min-h-11 shrink-0 items-center rounded-full bg-cream px-5 text-sm text-bg md:inline-flex"
        >
          Δες τα προϊόντα
        </Link>
      )}
    </header>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <form
      className="relative hidden min-w-0 flex-1 md:block md:max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const next = q.trim().slice(0, 80);
        void navigate({
          to: "/shop",
          search: next ? { q: next } : {},
        });
      }}
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        strokeWidth={1.75}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ψάξε προϊόν…"
        autoComplete="off"
        className="h-10 w-full rounded-full border border-line bg-transparent pl-10 pr-4 text-sm text-cream outline-none placeholder:text-muted focus:border-cream-dim"
      />
    </form>
  );
}
