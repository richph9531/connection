import { NextResponse } from "next/server";
import { buildMemberExport, exportFileName } from "@/lib/account/export";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  // Every query is filtered to the signed-in member and also limited by RLS.
  const [profile, checkIns, posts, comments] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role, recovery_start_date, longest_streak, timezone, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("check_ins")
      .select("date, clean, mood, urge_level, triggers, note, share_with_partner, created_at, updated_at")
      .eq("user_id", user.id),
    supabase.from("posts").select("id, body, milestone_days, created_at, removed_at").eq("author_id", user.id),
    supabase.from("comments").select("id, post_id, body, created_at, removed_at").eq("author_id", user.id),
  ]);

  if (profile.error || checkIns.error || posts.error || comments.error) {
    return NextResponse.json({ error: "We couldn't prepare your export. Please try again." }, { status: 500 });
  }

  const body = buildMemberExport({
    email: user.email ?? null,
    profile: profile.data,
    checkIns: checkIns.data,
    posts: posts.data,
    comments: comments.data,
  });

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(profile.data.timezone)}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
