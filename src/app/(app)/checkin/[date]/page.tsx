import Link from "next/link";
import { notFound } from "next/navigation";
import { CleanBadge, MoodFace, TriggerList } from "@/components/checkin/checkin-summary";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDay, isIsoDate } from "@/lib/checkin/days";
import { moodFor } from "@/lib/checkin/options";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";

export default async function CheckInDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isIsoDate(date)) notFound();

  const { supabase, user, profile } = await requireProfile();
  const { data: checkIn } = await supabase
    .from("check_ins")
    .select("date, clean, mood, urge_level, triggers, note, share_with_partner")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  if (!checkIn) notFound();

  const isToday = date === todayIn(profile.timezone);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/checkin/history" className="text-sm font-medium underline underline-offset-4">
        ← Back to history
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">{formatDay(checkIn.date)}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Stayed clean</dt>
            <dd className="flex items-center gap-2">
              {checkIn.clean ? "Yes" : "No"} <CleanBadge clean={checkIn.clean} />
            </dd>
            <dt className="text-muted-foreground">Mood</dt>
            <dd className="flex items-center gap-2">
              <MoodFace mood={checkIn.mood} /> {moodFor(checkIn.mood)?.label}
            </dd>
            <dt className="text-muted-foreground">Urge level</dt>
            <dd className="tabular-nums">{checkIn.urge_level} / 10</dd>
            <dt className="self-start text-muted-foreground">Triggers</dt>
            <dd>
              <TriggerList triggers={checkIn.triggers} />
            </dd>
            <dt className="text-muted-foreground">Shared with partner</dt>
            <dd>{checkIn.share_with_partner ? "Yes (without your note)" : "No"}</dd>
          </dl>
          <section className="mt-5 flex flex-col gap-1.5">
            <h2 className="text-sm font-medium">Private journal note</h2>
            {checkIn.note ? (
              <p data-testid="journal-note" className="text-sm break-words whitespace-pre-wrap">
                {checkIn.note}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No note for this day.</p>
            )}
            <p className="text-xs text-muted-foreground">Only you can see this.</p>
          </section>
        </CardContent>
      </Card>
      {isToday && (
        <Link href="/checkin" className={buttonVariants({ size: "lg", className: "h-11" })}>
          Edit today&apos;s check-in
        </Link>
      )}
    </div>
  );
}
