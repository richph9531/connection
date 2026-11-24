"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { todayIn } from "@/lib/dates";
import { requireProfile } from "@/lib/profile";
import { DISMISS_COOKIE, dismissKey } from "@/lib/streak/milestone-offer";
import { loadMilestonePostTimes } from "@/lib/streak/queries";
import { currentStreakDays, isMilestone, sharedInCurrentStreak } from "@/lib/streak/streak";

export type ShareState = { status?: "shared"; message?: string };

const shareSchema = z.object({
  days: z.coerce.number().int().refine(isMilestone, "That isn't a milestone."),
  body: z
    .string()
    .trim()
    .min(1, "Please write a short message.")
    .max(2000, "Please keep your message under 2000 characters."),
});

export async function shareMilestone(_prev: ShareState, formData: FormData): Promise<ShareState> {
  const parsed = shareSchema.safeParse({ days: formData.get("days"), body: formData.get("body") ?? "" });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Please check your message." };

  const { supabase, user, profile } = await requireProfile();
  const start = profile.recovery_start_date!;
  const { days, body } = parsed.data;
  if (days > currentStreakDays(start, todayIn(profile.timezone))) {
    return { message: "You haven't reached that milestone yet. Keep going!" };
  }

  const shared = await loadMilestonePostTimes(supabase, user.id, days);
  if (!sharedInCurrentStreak(shared, start, profile.timezone)) {
    const { error } = await supabase.from("posts").insert({ author_id: user.id, body, milestone_days: days });
    if (error) return { message: "Something went wrong. Please try again." };
  }

  revalidatePath("/streak");
  revalidatePath("/feed");
  return { status: "shared" };
}

export async function dismissMilestone(formData: FormData): Promise<void> {
  const days = Number(formData.get("days"));
  if (!isMilestone(days)) return;
  const { user, profile } = await requireProfile();
  const cookieStore = await cookies();
  cookieStore.set(DISMISS_COOKIE, dismissKey(user.id, profile.recovery_start_date!, days), {
    path: "/streak",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/streak");
}
