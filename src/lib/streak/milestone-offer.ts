import { latestMilestone, sharedInCurrentStreak } from "./streak";

export const DISMISS_COOKIE = "connection-milestone-dismissed";

export function dismissKey(recoveryStartDate: string, days: number): string {
  return `${recoveryStartDate}:${days}`;
}

/**
 * The latest milestone to celebrate, and whether it was already shared in this streak.
 * Null if no milestone is reached yet or the member said "not now" to sharing it.
 */
export function milestoneToOffer(opts: {
  streak: number;
  recoveryStartDate: string;
  timeZone: string;
  sharedPostTimes: readonly string[];
  dismissed: string | undefined;
}): { days: number; shared: boolean } | null {
  const days = latestMilestone(opts.streak);
  if (days === null) return null;
  const shared = sharedInCurrentStreak(opts.sharedPostTimes, opts.recoveryStartDate, opts.timeZone);
  if (!shared && opts.dismissed === dismissKey(opts.recoveryStartDate, days)) return null;
  return { days, shared };
}
