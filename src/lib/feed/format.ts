import { todayIn } from "@/lib/dates";

function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** A friendly timestamp in the viewer's own time zone, e.g. "Today at 14:05" or "3 Nov". */
export function formatPostTime(
  iso: string,
  timeZone: string,
  now: Date = new Date(),
): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const day = todayIn(timeZone, then);
  const today = todayIn(timeZone, now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(then);
  if (day === today) return `Today at ${time}`;
  if (day === previousDay(today)) return `Yesterday at ${time}`;
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(then);
}

export function milestoneLabel(days: number): string {
  return days === 1 ? "1 day milestone" : `${days} day milestone`;
}
