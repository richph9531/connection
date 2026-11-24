import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDays, nextMilestoneMessage, progressToNext, streakMessage } from "@/lib/streak/streak";

export function StreakSummary({
  streak,
  longest,
  recoveryStartDate,
}: {
  streak: number;
  longest: number;
  recoveryStartDate: string;
}) {
  const progress = progressToNext(streak);
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Current streak</p>
            <p className="text-2xl font-semibold" data-testid="current-streak">
              {formatDays(streak)}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Longest streak</p>
            <p className="text-2xl font-semibold" data-testid="longest-streak">
              {formatDays(longest)}
            </p>
          </div>
        </div>
        <p className="text-sm">{streakMessage(streak)}</p>
        <div className="flex flex-col gap-1.5">
          <div
            role="progressbar"
            aria-label="Progress to your next milestone"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{nextMilestoneMessage(streak)}</p>
        </div>
        <p className="text-xs text-muted-foreground">Counting from {formatDate(recoveryStartDate)}.</p>
      </CardContent>
    </Card>
  );
}
