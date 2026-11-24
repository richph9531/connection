import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { groupReports, type ReportGroup } from "./reports";
import type { InviteRow } from "./invites";
import type { MemberRole } from "./roles";

type Client = SupabaseClient<Database>;

export type ReportItem = ReportGroup & {
  body: string | null;
  authorName: string;
  removedAt: string | null;
};

export type RemovedItem = {
  kind: "post" | "comment";
  id: string;
  body: string;
  authorName: string;
  removedAt: string;
};

export type InviteItem = InviteRow & { createdByName: string | null; usedByName: string | null };

export type MemberItem = { id: string; displayName: string; role: MemberRole };

const FORMER_MEMBER = "A former member";

/** Display names only: never real names or emails. */
async function displayNames(supabase: Client, ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map();
  const { data } = await supabase.from("member_directory").select("id, display_name").in("id", unique);
  return new Map((data ?? []).flatMap((row) => (row.id && row.display_name ? [[row.id, row.display_name]] : [])));
}

export async function loadOpenReports(supabase: Client): Promise<ReportItem[]> {
  const { data: reports, error } = await supabase
    .from("reports")
    .select("id, post_id, comment_id, reason, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;

  const groups = groupReports(reports ?? []);
  const postIds = groups.filter((group) => group.kind === "post").map((group) => group.id);
  const commentIds = groups.filter((group) => group.kind === "comment").map((group) => group.id);

  const [posts, comments] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("id, body, author_id, removed_at").in("id", postIds)
      : Promise.resolve({ data: [] }),
    commentIds.length
      ? supabase.from("comments").select("id, body, author_id, removed_at").in("id", commentIds)
      : Promise.resolve({ data: [] }),
  ]);
  const content = new Map<string, { body: string; author_id: string; removed_at: string | null }>();
  for (const row of posts.data ?? []) content.set(`post:${row.id}`, row);
  for (const row of comments.data ?? []) content.set(`comment:${row.id}`, row);

  const names = await displayNames(
    supabase,
    [...content.values()].map((row) => row.author_id),
  );

  return groups.map((group) => {
    const row = content.get(`${group.kind}:${group.id}`);
    return {
      ...group,
      body: row?.body ?? null,
      authorName: (row && names.get(row.author_id)) ?? FORMER_MEMBER,
      removedAt: row?.removed_at ?? null,
    };
  });
}

export async function loadRemovedContent(supabase: Client, limit = 20): Promise<RemovedItem[]> {
  const [posts, comments] = await Promise.all([
    supabase
      .from("posts")
      .select("id, body, author_id, removed_at")
      .not("removed_at", "is", null)
      .order("removed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("comments")
      .select("id, body, author_id, removed_at")
      .not("removed_at", "is", null)
      .order("removed_at", { ascending: false })
      .limit(limit),
  ]);
  const rows = [
    ...(posts.data ?? []).map((row) => ({ ...row, kind: "post" as const })),
    ...(comments.data ?? []).map((row) => ({ ...row, kind: "comment" as const })),
  ];
  const names = await displayNames(
    supabase,
    rows.map((row) => row.author_id),
  );
  return rows
    .map((row) => ({
      kind: row.kind,
      id: row.id,
      body: row.body,
      authorName: names.get(row.author_id) ?? FORMER_MEMBER,
      removedAt: row.removed_at!,
    }))
    .sort((a, b) => b.removedAt.localeCompare(a.removedAt))
    .slice(0, limit);
}

export async function loadInvites(supabase: Client): Promise<InviteItem[]> {
  const { data, error } = await supabase
    .from("invites")
    .select("code, created_by, used_by, used_at, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const invites = data ?? [];
  const names = await displayNames(
    supabase,
    invites.flatMap((invite) => [invite.created_by, invite.used_by]),
  );
  return invites.map((invite) => ({
    ...invite,
    createdByName: invite.created_by ? (names.get(invite.created_by) ?? null) : null,
    usedByName: invite.used_by ? (names.get(invite.used_by) ?? FORMER_MEMBER) : invite.used_at ? FORMER_MEMBER : null,
  }));
}

export async function loadMembers(supabase: Client): Promise<MemberItem[]> {
  const { data, error } = await supabase
    .from("member_directory")
    .select("id, display_name, role")
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    row.id && row.display_name && row.role ? [{ id: row.id, displayName: row.display_name, role: row.role }] : [],
  );
}
