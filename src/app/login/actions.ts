"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    mode: formData.get("mode"),
    email: formData.get("email"),
    inviteCode: formData.get("inviteCode") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const emailRedirectTo = `${origin}/auth/callback`;

  if (parsed.data.mode === "join") {
    const { inviteCode } = parsed.data;
    const { data: valid } = await supabase.rpc("check_invite", { invite_code: inviteCode });
    if (!valid) {
      return { status: "error", message: "That invite code isn't valid or has expired. Please ask a moderator for a new one." };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { shouldCreateUser: true, emailRedirectTo, data: { invite_code: inviteCode } },
    });
    if (error && !/already registered|signups not allowed/i.test(error.message)) {
      return { status: "error", message: "We couldn't send the email. Please try again in a minute." };
    }
    return { status: "sent" };
  }

  // Always report success so the form never reveals who is a member.
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo },
  });
  return { status: "sent" };
}
