export function money(n: number) {
  return n.toFixed(2).replace(".", ",") + "€";
}

export function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("el-GR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
