import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MILESTONES, formatDays, nextMilestone } from "@/lib/streak/streak";

export function MilestoneList({ streak }: { streak: number }) {
  const next = nextMilestone(streak)?.days;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Milestones</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-4 gap-2" aria-label="Milestones">
          {MILESTONES.map((days) => {
            const reached = days <= streak;
            return (
              <li
                key={days}
                data-milestone={days}
                data-reached={reached}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg border p-2 text-center",
                  reached && "border-emerald-500 bg-emerald-50 text-emerald-900",
                  days === next && "border-dashed border-foreground/40",
                )}
              >
                <span className="flex items-center gap-1 text-base font-semibold">
                  {reached && <Check className="size-3.5" aria-hidden />}
                  {days}
                </span>
                <span className="text-[11px] leading-tight">
                  {days === 1 ? "day" : "days"}
                  <span className="sr-only">{reached ? ", reached" : days === next ? ", next up" : ""}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {next ? `Next up: ${formatDays(next)}.` : "You've reached every milestone."}
        </p>
      </CardContent>
    </Card>
  );
}
