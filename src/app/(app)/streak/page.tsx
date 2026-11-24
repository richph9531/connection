import { cookies } from "next/headers";
import { MilestoneList } from "@/components/streak/milestone-list";
import { MilestoneShareCard } from "@/components/streak/milestone-share-card";
import { StreakCalendar } from "@/components/streak/streak-calendar";
import { StreakSummary } from "@/components/streak/streak-summary";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { DISMISS_COOKIE, milestoneToOffer } from "@/lib/streak/milestone-offer";
import { loadCheckInResults, loadMilestonePostTimes, saveLongestStreak } from "@/lib/streak/queries";
import { currentStreakDays, latestMilestone, longestStreakDays, monthBounds, resolveMonth } from "@/lib/streak/streak";

export const metadata = { title: "Your progress · Connection" };

export default async function StreakPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase, user, profile } = await requireProfile();
  const start = profile.recovery_start_date!;
  const today = todayIn(profile.timezone);
  const streak = currentStreakDays(start, today);
  const longest = longestStreakDays(profile.longest_streak, streak);

  const month = resolveMonth((await searchParams).month, today);
  const { first, last } = monthBounds(month);
  const latest = latestMilestone(streak);

  const [cleanByDate, sharedPostTimes] = await Promise.all([
    loadCheckInResults(supabase, user.id, first, last),
    latest === null ? Promise.resolve([]) : loadMilestonePostTimes(supabase, user.id, latest),
    saveLongestStreak(supabase, user.id, profile.longest_streak, longest),
  ]);

  const offer = milestoneToOffer({
    userId: user.id,
    streak,
    recoveryStartDate: start,
    timeZone: profile.timezone,
    sharedPostTimes,
    dismissed: (await cookies()).get(DISMISS_COOKIE)?.value,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Your progress</h1>
      <StreakSummary streak={streak} longest={longest} recoveryStartDate={start} />
      {offer && <MilestoneShareCard key={`${start}:${offer.days}`} days={offer.days} shared={offer.shared} />}
      <StreakCalendar month={month} today={today} cleanByDate={cleanByDate} />
      <MilestoneList streak={streak} />
    </div>
  );
}
