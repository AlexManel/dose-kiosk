import { useDose } from "@/lib/store";

export function Toast() {
  const toast = useDose((s) => s.toast);
  const cartOpen = useDose((s) => s.cartOpen);
  if (!toast || cartOpen) return null;
  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-cream px-4 py-2.5 text-sm text-bg shadow-[var(--shadow-panel)]"
    >
      {toast}
    </div>
  );
}
