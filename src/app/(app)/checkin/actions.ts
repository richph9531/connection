"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayIn } from "@/lib/dates";
import { streakReset } from "@/lib/checkin/days";
import { parseCheckInForm, type CheckInFormValues } from "@/lib/checkin/schema";
import { createClient } from "@/lib/supabase/server";

export type CheckInState = {
  status?: "saved" | "error";
  message?: string;
  values?: CheckInFormValues;
  submittedAt?: number;
};

async function currentMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("recovery_start_date, longest_streak, timezone")
    .eq("id", user.id)
    .single();
  if (!profile?.recovery_start_date) redirect("/onboarding");
  return { supabase, user, profile: { ...profile, recovery_start_date: profile.recovery_start_date } };
}

export async function saveCheckIn(_prev: CheckInState, formData: FormData): Promise<CheckInState> {
  const submittedAt = Date.now();
  const { values, result } = parseCheckInForm(formData);
  if (!result.success) {
    return { status: "error", message: result.error.issues[0]?.message ?? "Please check the form.", values, submittedAt };
  }

  const { supabase, user, profile } = await currentMember();
  const { error } = await supabase.from("check_ins").upsert(
    {
      user_id: user.id,
      date: todayIn(profile.timezone),
      clean: result.data.clean,
      mood: result.data.mood,
      urge_level: result.data.urgeLevel,
      triggers: result.data.triggers,
      note: result.data.note,
      share_with_partner: result.data.shareWithPartner,
    },
    { onConflict: "user_id,date" },
  );
  if (error) {
    return { status: "error", message: "We couldn't save your check-in. Please try again.", values, submittedAt };
  }

  revalidatePath("/checkin", "layout");
  return { status: "saved", values, submittedAt };
}

export async function restartStreak(): Promise<void> {
  const { supabase, user, profile } = await currentMember();
  const reset = streakReset(profile, todayIn(profile.timezone));
  if (reset) await supabase.from("profiles").update(reset).eq("id", user.id);
  revalidatePath("/", "layout");
}
