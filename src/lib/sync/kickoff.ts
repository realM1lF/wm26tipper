/** Parse worldcup26.ir local_date "MM/DD/YYYY HH:mm" (venue local, EDT+4h ≈ UTC in June) */
export function parseApiKickoff(localDate: string): string {
  const [datePart, timePart] = localDate.split(" ");
  const [month, day, year] = datePart!.split("/").map(Number);
  const [hours, minutes] = timePart!.split(":").map(Number);
  // June/July 2026 host venues: EDT (UTC-4) → UTC = local + 4h
  return new Date(Date.UTC(year, month - 1, day, hours + 4, minutes)).toISOString();
}
