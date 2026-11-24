import { todayIn } from "@/lib/dates";

export const MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365] as const;

export type DayStatus = "clean" | "fresh-start" | "none" | "future";

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function toUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isDate(value: string): boolean {
  return DATE_RE.test(value) && !Number.isNaN(toUtc(value)) && fromUtc(toUtc(value)) === value;
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Days since the recovery start date, in the member's own calendar. Never negative. */
export function currentStreakDays(recoveryStartDate: string, today: string): number {
  return Math.max(0, daysBetween(recoveryStartDate, today));
}

export function longestStreakDays(storedLongest: number, current: number): number {
  return Math.max(storedLongest, current);
}

export function isMilestone(days: number): boolean {
  return (MILESTONES as readonly number[]).includes(days);
}

export function reachedMilestones(streak: number): number[] {
  return MILESTONES.filter((m) => m <= streak);
}

/** The biggest milestone reached in the current streak, if any. */
export function latestMilestone(streak: number): number | null {
  return reachedMilestones(streak).at(-1) ?? null;
}

export function nextMilestone(streak: number): { days: number; remaining: number } | null {
  const next = MILESTONES.find((m) => m > streak);
  return next === undefined ? null : { days: next, remaining: next - streak };
}

/** Progress (0–100) from the previous milestone towards the next one. */
export function progressToNext(streak: number): number {
  const next = nextMilestone(streak);
  if (!next) return 100;
  const previous = latestMilestone(streak) ?? 0;
  return Math.round(((streak - previous) / (next.days - previous)) * 100);
}

export function formatDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function streakMessage(streak: number): string {
  if (streak === 0) return "Today is day one. Every day is a fresh start, and you've already taken the first step.";
  if (streak < 7) return "Every day counts. Keep going, one day at a time.";
  if (streak < 30) return "You're building real momentum. Be proud of how far you've come.";
  if (streak < 365) return "Look at what you've built. Your steady effort is paying off.";
  return "More than a year of recovery. Thank you for showing the way for others.";
}

export function nextMilestoneMessage(streak: number): string {
  const next = nextMilestone(streak);
  if (!next) return "You've reached every milestone. Keep going, we're cheering you on.";
  return `${formatDays(next.remaining)} to your ${next.days}-day milestone.`;
}

export function milestoneShareText(days: number): string {
  return `I just reached ${formatDays(days)} in my recovery. Thank you all for the support. One day at a time!`;
}

/** Status of a calendar day based on the member's check-in for that day. */
export function dayStatus(date: string, today: string, cleanByDate: ReadonlyMap<string, boolean>): DayStatus {
  if (date > today) return "future";
  const clean = cleanByDate.get(date);
  if (clean === undefined) return "none";
  return clean ? "clean" : "fresh-start";
}

/** The month (YYYY-MM) to show: a valid, non-future `requested` month, or the current month. */
export function resolveMonth(requested: string | undefined, today: string): string {
  const current = today.slice(0, 7);
  if (!requested || !MONTH_RE.test(requested) || requested > current) return current;
  return requested;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthBounds(month: string): { first: string; last: string } {
  const first = `${month}-01`;
  return { first, last: addDays(`${shiftMonth(month, 1)}-01`, -1) };
}

/** Weeks (Monday first) for a month; days outside the month are null. */
export function monthGrid(month: string): (string | null)[][] {
  const { first, last } = monthBounds(month);
  const leading = (new Date(toUtc(first)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let d = first; d <= last; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(toUtc(`${month}-01`)),
  );
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(toUtc(date)),
  );
}

/** True if a milestone post was shared during the current streak (dates in the member's time zone). */
export function sharedInCurrentStreak(
  postCreatedAt: readonly string[],
  recoveryStartDate: string,
  timeZone: string,
): boolean {
  return postCreatedAt.some((createdAt) => todayIn(timeZone, new Date(createdAt)) >= recoveryStartDate);
}
