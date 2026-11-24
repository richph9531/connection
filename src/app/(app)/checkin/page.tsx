import Link from "next/link";
import { CheckInForm } from "@/components/checkin/checkin-form";
import { RelapseSupport } from "@/components/checkin/relapse-support";
import { formatDay } from "@/lib/checkin/days";
import { rowToFormValues, type CheckInRow } from "@/lib/checkin/rows";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { restartStreak, saveCheckIn } from "./actions";

export default async function CheckInPage() {
  const { supabase, user, profile } = await requireProfile();
  const today = todayIn(profile.timezone);
  const { data: checkIn, error } = await supabase
    .from("check_ins")
    .select("clean, mood, urge_level, triggers, note, share_with_partner")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daily check-in</h1>
          <p className="text-sm text-muted-foreground">{formatDay(today)}</p>
        </div>
        <Link href="/checkin/history" className="text-sm font-medium underline underline-offset-4">
          History
        </Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-muted p-3 text-sm">
          We couldn&apos;t load today&apos;s check-in just now. Please refresh the page to try again.
        </p>
      ) : (
        <CheckInSection
          checkIn={checkIn}
          today={today}
          streakStartsToday={(profile.recovery_start_date ?? today) >= today}
        />
      )}
    </div>
  );
}

function CheckInSection({
  checkIn,
  today,
  streakStartsToday,
}: {
  checkIn: CheckInRow | null;
  today: string;
  streakStartsToday: boolean;
}) {
  return (
    <>
      {checkIn && !checkIn.clean && (
        <RelapseSupport streakStartsToday={streakStartsToday} restartStreak={restartStreak} />
      )}

      <p className="text-sm text-muted-foreground">
        {checkIn
          ? "You've checked in today. You can update it until the end of the day."
          : "How did today go? This takes less than a minute."}
      </p>

      <CheckInForm action={saveCheckIn} date={today} initial={checkIn ? rowToFormValues(checkIn) : null} />
    </>
  );
}
