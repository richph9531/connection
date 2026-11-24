"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  commentBodySchema,
  idSchema,
  postBodySchema,
  reactionSchema,
  reportSchema,
} from "@/lib/feed/validation";

export type FormState = {
  ok?: boolean;
  message?: string;
  submittedAt?: number;
};

const SOMETHING_WENT_WRONG = "Something went wrong. Please try again.";

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

function done(): FormState {
  revalidatePath("/feed");
  return { ok: true, submittedAt: Date.now() };
}

export async function createPost(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = postBodySchema.safeParse(formData.get("body") ?? "");
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const { supabase, userId } = await signedIn();
  const { error } = await supabase
    .from("posts")
    .insert({ author_id: userId, body: parsed.data });
  if (error) return { message: SOMETHING_WENT_WRONG };
  revalidatePath("/feed");
  redirect("/feed");
}

export async function deletePost(postId: string): Promise<FormState> {
  const id = idSchema.safeParse(postId);
  if (!id.success) return { message: SOMETHING_WENT_WRONG };
  const { supabase, userId } = await signedIn();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id.data)
    .eq("author_id", userId);
  return error ? { message: SOMETHING_WENT_WRONG } : done();
}

export async function createComment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const postId = idSchema.safeParse(formData.get("postId"));
  const body = commentBodySchema.safeParse(formData.get("body") ?? "");
  if (!postId.success) return { message: SOMETHING_WENT_WRONG };
  if (!body.success) return { message: body.error.issues[0]?.message };
  const { supabase, userId } = await signedIn();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId.data, author_id: userId, body: body.data });
  if (error?.code === "42501")
    return { message: "Replies are closed on this post." };
  return error ? { message: SOMETHING_WENT_WRONG } : done();
}

export async function deleteComment(commentId: string): Promise<FormState> {
  const id = idSchema.safeParse(commentId);
  if (!id.success) return { message: SOMETHING_WENT_WRONG };
  const { supabase, userId } = await signedIn();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id.data)
    .eq("author_id", userId);
  return error ? { message: SOMETHING_WENT_WRONG } : done();
}

export async function setReaction(
  postId: string,
  kind: string,
  on: boolean,
): Promise<FormState> {
  const parsed = reactionSchema.safeParse({ postId, kind });
  if (!parsed.success) return { message: SOMETHING_WENT_WRONG };
  const { supabase, userId } = await signedIn();
  const row = {
    post_id: parsed.data.postId,
    user_id: userId,
    kind: parsed.data.kind,
  };
  const { error } = on
    ? await supabase.from("reactions").insert(row)
    : await supabase.from("reactions").delete().match(row);
  if (error && error.code !== "23505") return { message: SOMETHING_WENT_WRONG };
  return done();
}

export async function reportContent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reportSchema.safeParse({
    target: formData.get("target"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success)
    return { message: parsed.error.issues[0]?.message ?? SOMETHING_WENT_WRONG };
  const { supabase, userId } = await signedIn();
  const { target, targetId, reason } = parsed.data;
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reason,
    ...(target === "post" ? { post_id: targetId } : { comment_id: targetId }),
  });
  return error
    ? { message: SOMETHING_WENT_WRONG }
    : { ok: true, submittedAt: Date.now() };
}
