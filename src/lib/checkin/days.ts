const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toUtc(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(toUtc(value));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). Never negative. */
export function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.round((toUtc(to) - toUtc(from)) / 86_400_000));
}

/** A friendly date such as "Tuesday, 24 November 2026" or "Tue 24 Nov". */
export function formatDay(date: string, style: "long" | "short" = "long"): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: style,
    day: "numeric",
    month: style,
    year: "numeric",
  })
    .formatToParts(new Date(toUtc(date)))
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return style === "long"
    ? `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`
    : `${parts.weekday} ${parts.day} ${parts.month}`;
}

/**
 * Values for restarting the streak from `today`, keeping the longest streak so far.
 * Returns null when the streak already starts today.
 */
export function streakReset(
  profile: { recovery_start_date: string; longest_streak: number },
  today: string,
): { recovery_start_date: string; longest_streak: number } | null {
  if (profile.recovery_start_date >= today) return null;
  return {
    recovery_start_date: today,
    longest_streak: Math.max(profile.longest_streak, daysBetween(profile.recovery_start_date, today)),
  };
}
