import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function Brand({
  to = "/",
  sub = "Coffee & More",
  onSecret,
  className,
}: {
  to?: string;
  sub?: string;
  onSecret?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("flex flex-col leading-none", className)}
      onClick={(e) => {
        if (!onSecret) return;
        const now = Date.now();
        const el = e.currentTarget as HTMLAnchorElement & { _taps?: number[]; };
        el._taps = (el._taps ?? []).filter((t) => now - t < 700);
        el._taps.push(now);
        if (el._taps.length >= 3) {
          e.preventDefault();
          onSecret();
        }
      }}
    >
      <span className="font-display text-[2rem] font-medium tracking-[0.02em] text-cream">
        Dose
      </span>
      <span className="text-[10px] uppercase tracking-[0.28em] text-cream-dim">
        {sub}
      </span>
    </Link>
  );
}
