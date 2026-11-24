import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

/** Clean/not-clean results for the member's own check-ins in a date range. Never reads the note. */
export async function loadCheckInResults(supabase: Client, userId: string, first: string, last: string) {
  const { data, error } = await supabase
    .from("check_ins")
    .select("date, clean")
    .eq("user_id", userId)
    .gte("date", first)
    .lte("date", last);
  if (error) throw new Error("Could not load your check-ins");
  return new Map(data.map((row) => [row.date, row.clean]));
}

/** Creation times of the member's own posts for a milestone. */
export async function loadMilestonePostTimes(supabase: Client, userId: string, days: number) {
  const { data, error } = await supabase
    .from("posts")
    .select("created_at")
    .eq("author_id", userId)
    .eq("milestone_days", days);
  if (error) throw new Error("Could not load your milestone posts");
  return data.map((row) => row.created_at);
}

/** Saves a new longest streak; the stored value never goes down. */
export async function saveLongestStreak(supabase: Client, userId: string, storedLongest: number, longest: number) {
  if (longest <= storedLongest) return;
  await supabase.from("profiles").update({ longest_streak: longest }).eq("id", userId).lt("longest_streak", longest);
}
