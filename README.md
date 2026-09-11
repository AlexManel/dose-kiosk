# Dose Coffee & More — kiosk

E-shop / kiosk για το **Dose** (καφέ, αναψυκτικά, χυμοί, energy, σνακ, ψιλικά, τσιγάρα, θερμαινόμενος καπνός).

Παραγγελίες μέσω WhatsApp. Admin με 5 taps στο footer.

## Run

```bash
npm install
npm run dev
```

Άνοιγμα στο `http://localhost:8080`.

## Stack

- TanStack Start + React 19 + Vite + Tailwind
- PGLite (local) / Neon (αν οριστεί `DATABASE_URL`)
- Κατάλογος στο `src/lib/catalog.ts` + `migrations/`

## Σημείωση

Αυτό το repo είναι **ξεχωριστό** από `dose-preview` και οποιοδήποτε άλλο site. Δεν αντικαθιστά υπάρχοντα deploys.
