import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dayStatus, formatDate, formatMonth, monthGrid, shiftMonth, type DayStatus } from "@/lib/streak/streak";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS: Record<DayStatus, { label: string; className: string }> = {
  clean: { label: "Clean day", className: "bg-emerald-500 text-white" },
  "fresh-start": { label: "Fresh start", className: "bg-amber-200 text-amber-950" },
  none: { label: "No check-in", className: "bg-muted text-foreground" },
  future: { label: "Coming up", className: "text-muted-foreground/50" },
};

const LEGEND: DayStatus[] = ["clean", "fresh-start", "none"];

export function StreakCalendar({
  month,
  today,
  cleanByDate,
}: {
  month: string;
  today: string;
  cleanByDate: ReadonlyMap<string, boolean>;
}) {
  const isCurrentMonth = month === today.slice(0, 7);
  const navClass = "inline-flex size-9 items-center justify-center rounded-md hover:bg-muted";

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <Link href={`/streak?month=${shiftMonth(month, -1)}`} className={navClass} aria-label="Previous month" scroll={false}>
          <ChevronLeft className="size-4" />
        </Link>
        <CardTitle>
          <h2 aria-live="polite">{formatMonth(month)}</h2>
        </CardTitle>
        {isCurrentMonth ? (
          <span className="size-9" aria-hidden />
        ) : (
          <Link href={`/streak?month=${shiftMonth(month, 1)}`} className={navClass} aria-label="Next month" scroll={false}>
            <ChevronRight className="size-4" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <table className="w-full table-fixed border-separate border-spacing-1" aria-label={`Check-ins in ${formatMonth(month)}`}>
          <thead>
            <tr>
              {WEEKDAYS.map((day) => (
                <th key={day} scope="col" className="text-xs font-normal text-muted-foreground">
                  <abbr title={day} className="no-underline">
                    {day.slice(0, 1)}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(month).map((week, i) => (
              <tr key={i}>
                {week.map((date, j) => {
                  if (!date) return <td key={j} />;
                  const status = dayStatus(date, today, cleanByDate);
                  return (
                    <td key={date} className="p-0">
                      <div
                        data-date={date}
                        data-status={status}
                        aria-label={`${formatDate(date)}: ${STATUS[status].label}`}
                        aria-current={date === today ? "date" : undefined}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-md text-sm",
                          STATUS[status].className,
                          date === today && "ring-2 ring-foreground ring-offset-1",
                        )}
                      >
                        {Number(date.slice(8))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Calendar key">
          {LEGEND.map((status) => (
            <li key={status} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-sm", STATUS[status].className)} aria-hidden />
              {STATUS[status].label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
