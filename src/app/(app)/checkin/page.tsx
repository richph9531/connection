import Link from "next/link";
import { CheckInForm } from "@/components/checkin/checkin-form";
import { RelapseSupport } from "@/components/checkin/relapse-support";
import { formatDay } from "@/lib/checkin/days";
import { rowToFormValues } from "@/lib/checkin/rows";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { restartStreak, saveCheckIn } from "./actions";

export default async function CheckInPage() {
  const { supabase, user, profile } = await requireProfile();
  const today = todayIn(profile.timezone);
  const { data: checkIn } = await supabase
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

      {checkIn && !checkIn.clean && (
        <RelapseSupport
          streakStartsToday={(profile.recovery_start_date ?? today) >= today}
          restartStreak={restartStreak}
        />
      )}

      <p className="text-sm text-muted-foreground">
        {checkIn
          ? "You've checked in today. You can update it until the end of the day."
          : "How did today go? This takes less than a minute."}
      </p>

      <CheckInForm action={saveCheckIn} initial={checkIn ? rowToFormValues(checkIn) : null} />
    </div>
  );
}
