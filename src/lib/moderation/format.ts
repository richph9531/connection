/** A short date like "24 Nov 2026" in the viewer's own time zone. */
export function formatDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
