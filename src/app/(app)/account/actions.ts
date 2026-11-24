"use server";

import { redirect } from "next/navigation";
import { deleteAccountSchema } from "@/lib/account/delete-account";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { message?: string };

export async function deleteAccount(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const parsed = deleteAccountSchema.safeParse({ confirmation: String(formData.get("confirmation") ?? "") });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Please confirm to continue." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { message: "Something went wrong and nothing was deleted. Please try again." };

  // The login is already gone; this clears the session cookies in the browser.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/help?deleted=1");
}
