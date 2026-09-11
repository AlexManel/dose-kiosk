import { Search, X } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Ψάξε freddo, terea, fanta…",
  autoFocus = false,
}: {
  value: string;
  onChange: (q: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">Αναζήτηση προϊόντων</span>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        strokeWidth={1.75}
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-full border border-line bg-bg-2 pl-11 pr-11 text-sm text-cream outline-none placeholder:text-muted focus:border-cream-dim"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted hover:text-cream"
          aria-label="Καθαρισμός"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}
    </label>
  );
}
