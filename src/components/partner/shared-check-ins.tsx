import { Badge } from "@/components/ui/badge";
import type { SharedCheckIn } from "@/lib/partner/data";
import { cleanLabel, formatCheckInDate, formatTrigger, moodFor } from "@/lib/partner/format";

const VISIBLE = 7;

function CheckInRow({ checkIn, today }: { checkIn: SharedCheckIn; today: string }) {
  const mood = moodFor(checkIn.mood);
  return (
    <li className="flex flex-col gap-2 py-3" data-testid="shared-check-in">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{checkIn.date === today ? "Today" : formatCheckInDate(checkIn.date)}</span>
        <Badge variant={checkIn.clean ? "secondary" : "outline"}>{cleanLabel(checkIn.clean)}</Badge>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span>
          Mood: <span aria-hidden="true">{mood.face}</span> {mood.label}
        </span>
        <span>Urge: {checkIn.urge_level}/10</span>
      </div>
      {checkIn.triggers.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Triggers">
          {checkIn.triggers.map((trigger) => (
            <li key={trigger}>
              <Badge variant="outline">{formatTrigger(trigger)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function SharedCheckIns({ checkIns, today, days }: { checkIns: SharedCheckIn[]; today: string; days: number }) {
  if (checkIns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No shared check-ins in the last {days} days yet. They&apos;ll show up here when your partner shares one.
      </p>
    );
  }
  const recent = checkIns.slice(0, VISIBLE);
  const earlier = checkIns.slice(VISIBLE);
  return (
    <div className="text-sm">
      <ul className="divide-y">
        {recent.map((checkIn) => (
          <CheckInRow key={checkIn.date} checkIn={checkIn} today={today} />
        ))}
      </ul>
      {earlier.length > 0 && (
        <details className="border-t pt-2">
          <summary className="cursor-pointer py-2 text-muted-foreground">Show earlier check-ins</summary>
          <ul className="divide-y">
            {earlier.map((checkIn) => (
              <CheckInRow key={checkIn.date} checkIn={checkIn} today={today} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
