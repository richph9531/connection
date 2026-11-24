"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation";

export type OnboardingState = { message?: string };

export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    recoveryStartDate: formData.get("recoveryStartDate"),
    timezone: formData.get("timezone") || undefined,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      recovery_start_date: parsed.data.recoveryStartDate,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id);

  if (error?.code === "23505") return { message: "That name is already taken. Please choose another." };
  if (error) return { message: "Something went wrong. Please try again." };
  redirect("/checkin");
}
