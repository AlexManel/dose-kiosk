import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

const TAP_WINDOW_MS = 1200;
const TAPS_NEEDED = 5;

export function Footer() {
  const navigate = useNavigate();
  const taps = useRef<number[]>([]);

  function onDoseTap() {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < TAP_WINDOW_MS);
    taps.current.push(now);
    if (taps.current.length >= TAPS_NEEDED) {
      taps.current = [];
      navigate({ to: "/admin" });
    }
  }

  return (
    <footer className="relative z-10 border-t border-line px-5 pb-10 pt-16 text-center">
      <button
        type="button"
        onClick={onDoseTap}
        className="font-display text-5xl text-cream"
      >
        Dose
      </button>
      <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-cream-dim">
        — Coffee & More —
      </p>
      <small className="mt-4 block text-sm text-muted">
        © 2026 Dose. Καφές, ψωμί, ψιλικά, τσιγάρα.
      </small>
    </footer>
  );
}
