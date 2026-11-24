import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, recovery_start_date, longest_streak, timezone")
    .eq("id", user.id)
    .single();

  if (!profile?.display_name || !profile.recovery_start_date) redirect("/onboarding");
  return { supabase, user, profile };
}
