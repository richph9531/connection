"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadOpenPartnerships } from "@/lib/partner/data";
import {
  checkNewRequest,
  escapeLike,
  OPEN_STATUSES,
  pickMember,
  REQUEST_MESSAGES,
  requestPartnerSchema,
} from "@/lib/partner/partnerships";

export type PartnerActionState = { status: "idle" | "success" | "error"; message?: string };

const idSchema = z.string().uuid();

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, me: user.id };
}

function failure(message: string): PartnerActionState {
  return { status: "error", message };
}

export async function requestPartner(_prev: PartnerActionState, formData: FormData): Promise<PartnerActionState> {
  const parsed = requestPartnerSchema.safeParse({ displayName: formData.get("displayName") ?? "" });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Please check the display name.");
  const { displayName } = parsed.data;

  const { supabase, me } = await signedIn();
  const { data: matches } = await supabase
    .from("member_directory")
    .select("id, display_name")
    .ilike("display_name", escapeLike(displayName))
    .limit(5);
  const member = pickMember(matches ?? [], displayName);
  if (!member?.id) return failure(REQUEST_MESSAGES["not-found"]);

  const check = checkNewRequest(await loadOpenPartnerships(supabase), me, member.id);
  if (!check.ok) return failure(REQUEST_MESSAGES[check.reason]);

  const { error } = await supabase.from("partnerships").insert({ requester_id: me, partner_id: member.id });
  if (error) return failure(REQUEST_MESSAGES.error);

  revalidatePath("/partner");
  return { status: "success", message: `Request sent to ${member.display_name}.` };
}

export async function respondToRequest(_prev: PartnerActionState, formData: FormData): Promise<PartnerActionState> {
  const id = idSchema.safeParse(formData.get("partnershipId"));
  if (!id.success) return failure(REQUEST_MESSAGES.error);
  const accept = formData.get("answer") === "accept";

  const { supabase, me } = await signedIn();
  const { data, error } = await supabase
    .from("partnerships")
    .update({ status: accept ? "active" : "declined" })
    .eq("id", id.data)
    .eq("partner_id", me)
    .eq("status", "pending")
    .select("id");
  if (error || !data?.length) return failure("This request is no longer open.");

  revalidatePath("/partner");
  return { status: "success" };
}

export async function cancelRequest(_prev: PartnerActionState, formData: FormData): Promise<PartnerActionState> {
  const id = idSchema.safeParse(formData.get("partnershipId"));
  if (!id.success) return failure(REQUEST_MESSAGES.error);

  const { supabase, me } = await signedIn();
  const { data, error } = await supabase
    .from("partnerships")
    .update({ status: "ended" })
    .eq("id", id.data)
    .eq("requester_id", me)
    .eq("status", "pending")
    .select("id");
  if (error) return failure(REQUEST_MESSAGES.error);
  revalidatePath("/partner");
  if (!data?.length) return failure("This request was already answered. Refresh to see the latest.");
  return { status: "success" };
}

/** Ends every open partnership (or pending request) between the member and another member. */
export async function endPartnership(_prev: PartnerActionState, formData: FormData): Promise<PartnerActionState> {
  const other = idSchema.safeParse(formData.get("otherId"));
  if (!other.success) return failure(REQUEST_MESSAGES.error);

  const { supabase, me } = await signedIn();
  const { error } = await supabase
    .from("partnerships")
    .update({ status: "ended" })
    .in("status", OPEN_STATUSES)
    .or(`and(requester_id.eq.${me},partner_id.eq.${other.data}),and(requester_id.eq.${other.data},partner_id.eq.${me})`);
  if (error) return failure(REQUEST_MESSAGES.error);

  revalidatePath("/partner");
  return { status: "success" };
}
