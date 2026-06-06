/** Local calendar date as YYYY-MM-DD (respects the device timezone, PRD §2 daily reset). */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift a YYYY-MM-DD string by `days` (can be negative), returning YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return localDateISO(date);
}

/** Human-friendly label for the dashboard header. */
export function formatDateLabel(iso: string): string {
  if (iso === localDateISO()) return "Today";
  if (iso === addDays(localDateISO(), -1)) return "Yesterday";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isToday(iso: string): boolean {
  return iso === localDateISO();
}
