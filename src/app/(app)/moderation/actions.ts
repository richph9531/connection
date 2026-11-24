"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode, inviteExpiry } from "@/lib/moderation/invites";
import { canChangeRole, isModerator, type MemberRole } from "@/lib/moderation/roles";
import {
  contentActionSchema,
  createInviteSchema,
  reportActionSchema,
  setRoleSchema,
  withdrawInviteSchema,
} from "@/lib/moderation/schemas";

export type ActionState = { status: "idle" | "ok" | "error"; message?: string };
export type InviteState = ActionState & { code?: string; joinUrl?: string };

const TRY_AGAIN = "Something went wrong. Please try again.";

async function signedInModerator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
  const role = (profile?.role ?? "member") as MemberRole;
  return { supabase, user, role, allowed: isModerator(role) };
}

function refresh() {
  revalidatePath("/moderation");
  revalidatePath("/feed");
}

async function setRemoved(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: "post" | "comment",
  target: string,
  removed: boolean,
) {
  const fn = kind === "post" ? "set_post_removed" : "set_comment_removed";
  return supabase.rpc(fn, { target, removed });
}

export async function decideReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reportActionSchema.safeParse({
    kind: formData.get("kind"),
    targetId: formData.get("targetId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { status: "error", message: TRY_AGAIN };
  const { supabase, allowed } = await signedInModerator();
  if (!allowed) return { status: "error", message: "Only moderators can do this." };

  const { kind, targetId, decision } = parsed.data;
  if (decision === "remove" || decision === "restore") {
    const { error } = await setRemoved(supabase, kind, targetId, decision === "remove");
    if (error) return { status: "error", message: TRY_AGAIN };
  }

  const status = decision === "remove" || decision === "resolve" ? "resolved" : "dismissed";
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq(kind === "post" ? "post_id" : "comment_id", targetId)
    .eq("status", "open");
  if (error) return { status: "error", message: TRY_AGAIN };

  refresh();
  return { status: "ok" };
}

export async function restoreContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contentActionSchema.safeParse({ kind: formData.get("kind"), targetId: formData.get("targetId") });
  if (!parsed.success) return { status: "error", message: TRY_AGAIN };
  const { supabase, allowed } = await signedInModerator();
  if (!allowed) return { status: "error", message: "Only moderators can do this." };

  const { error } = await setRemoved(supabase, parsed.data.kind, parsed.data.targetId, false);
  if (error) return { status: "error", message: TRY_AGAIN };
  refresh();
  return { status: "ok" };
}

export async function createInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const parsed = createInviteSchema.safeParse({ days: formData.get("days") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? TRY_AGAIN };
  const { supabase, user, allowed } = await signedInModerator();
  if (!allowed) return { status: "error", message: "Only moderators can create invites." };

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode((size) => crypto.getRandomValues(new Uint8Array(size)));
    const { error } = await supabase
      .from("invites")
      .insert({ code, created_by: user.id, expires_at: inviteExpiry(parsed.data.days) });
    if (error?.code === "23505") continue;
    if (error) return { status: "error", message: TRY_AGAIN };

    const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
    revalidatePath("/moderation");
    return { status: "ok", code, joinUrl: `${origin}/login?mode=join` };
  }
  return { status: "error", message: TRY_AGAIN };
}

export async function withdrawInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = withdrawInviteSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { status: "error", message: TRY_AGAIN };
  const { supabase, allowed } = await signedInModerator();
  if (!allowed) return { status: "error", message: "Only moderators can withdraw invites." };

  const { error } = await supabase.from("invites").delete().eq("code", parsed.data.code).is("used_at", null);
  if (error) return { status: "error", message: TRY_AGAIN };
  revalidatePath("/moderation");
  return { status: "ok" };
}

export async function changeRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = setRoleSchema.safeParse({ memberId: formData.get("memberId"), role: formData.get("role") });
  if (!parsed.success) return { status: "error", message: "Please choose a role." };
  const { supabase, user, role } = await signedInModerator();
  if (!canChangeRole({ id: user.id, role }, parsed.data.memberId)) {
    return { status: "error", message: "Only admins can change other members' roles." };
  }

  const { error } = await supabase.rpc("set_member_role", {
    member: parsed.data.memberId,
    new_role: parsed.data.role,
  });
  if (error) return { status: "error", message: TRY_AGAIN };
  revalidatePath("/moderation");
  return { status: "ok", message: "Role updated." };
}
