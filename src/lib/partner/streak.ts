const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMs(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole days from one YYYY-MM-DD date to another (never negative). */
export function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS));
}

/** Shifts a YYYY-MM-DD date by a number of days. */
export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export type PartnerStreak = { current: number; longest: number };

/** Current streak (days since the recovery start date) and the longest streak so far. */
export function partnerStreak(recoveryStartDate: string | null, longestStreak: number, today: string): PartnerStreak {
  const current = recoveryStartDate ? daysBetween(recoveryStartDate, today) : 0;
  return { current, longest: Math.max(current, longestStreak) };
}

export function formatDays(days: number): string {
  if (days === 0) return "Fresh start today";
  return days === 1 ? "1 day" : `${days} days`;
}
