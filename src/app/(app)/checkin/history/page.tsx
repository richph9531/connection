import Link from "next/link";
import { CleanBadge, MoodFace } from "@/components/checkin/checkin-summary";
import { buttonVariants } from "@/components/ui/button";
import { formatDay } from "@/lib/checkin/days";
import { HISTORY_PAGE_SIZE, pageFromParam } from "@/lib/checkin/rows";
import { requireProfile } from "@/lib/profile";

export default async function CheckInHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const page = pageFromParam((await searchParams).page);
  const { supabase, user } = await requireProfile();
  const from = (page - 1) * HISTORY_PAGE_SIZE;
  const { data: checkIns, count } = await supabase
    .from("check_ins")
    .select("date, clean, mood, urge_level", { count: "exact" })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(from, from + HISTORY_PAGE_SIZE - 1);
  const rows = checkIns ?? [];
  const hasMore = (count ?? 0) > from + rows.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Check-in history</h1>
        <Link href="/checkin" className="text-sm font-medium underline underline-offset-4">
          Today
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {page === 1 ? "No check-ins yet. Your first one takes less than a minute." : "No more check-ins."}{" "}
          <Link href="/checkin" className="font-medium text-foreground underline underline-offset-4">
            Check in now
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10" aria-label="Your check-ins">
          {rows.map((row) => (
            <li key={row.date}>
              <Link
                href={`/checkin/${row.date}`}
                className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-muted"
              >
                <MoodFace mood={row.mood} />
                <span className="flex-1 text-sm font-medium">{formatDay(row.date, "short")}</span>
                <span className="text-xs text-muted-foreground tabular-nums">Urge {row.urge_level}</span>
                <CleanBadge clean={row.clean} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <nav aria-label="History pages" className="flex justify-between">
          {page > 1 ? (
            <Link href={`/checkin/history?page=${page - 1}`} className={buttonVariants({ variant: "outline" })}>
              Newer
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link href={`/checkin/history?page=${page + 1}`} className={buttonVariants({ variant: "outline" })}>
              Older
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
