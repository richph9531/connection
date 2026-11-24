import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { pageRange, PAGE_SIZE } from "./pagination";
import {
  emptyReactionSummary,
  summarizeReactions,
  type ReactionSummary,
} from "./reactions";

export type FeedComment = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  removed: boolean;
};

export type FeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  milestoneDays: number | null;
  createdAt: string;
  removed: boolean;
  reactions: ReactionSummary;
  comments: FeedComment[];
};

export type FeedPage = { posts: FeedPost[]; hasOlder: boolean; error: boolean };

const FORMER_MEMBER = "Former member";

/**
 * Loads one page of the feed, newest first. RLS decides what is visible; on top of that,
 * removed posts and comments are only listed for their own author so they can see what happened.
 */
export async function loadFeedPage(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  page: number,
): Promise<FeedPage> {
  const { from, to } = pageRange(page);
  const visibleToViewer = `removed_at.is.null,author_id.eq.${viewerId}`;

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, author_id, body, milestone_days, created_at, removed_at")
    .or(visibleToViewer)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error || !postRows) return { posts: [], hasOlder: false, error: true };

  const rows = postRows.slice(0, PAGE_SIZE);
  const postIds = rows.map((post) => post.id);
  if (postIds.length === 0) return { posts: [], hasOlder: false, error: false };

  const [commentsResult, reactionsResult] = await Promise.all([
    supabase
      .from("comments")
      .select("id, post_id, author_id, body, created_at, removed_at")
      .in("post_id", postIds)
      .or(visibleToViewer)
      .order("created_at", { ascending: true }),
    supabase
      .from("reactions")
      .select("post_id, user_id, kind")
      .in("post_id", postIds),
  ]);
  const commentRows = commentsResult.data ?? [];

  const authorIds = [
    ...new Set([
      ...rows.map((p) => p.author_id),
      ...commentRows.map((c) => c.author_id),
    ]),
  ];
  const { data: members } = await supabase
    .from("member_directory")
    .select("id, display_name")
    .in("id", authorIds);
  const names = new Map(
    (members ?? []).map((member) => [member.id, member.display_name]),
  );
  const nameOf = (id: string) => names.get(id) ?? FORMER_MEMBER;

  const reactions = summarizeReactions(reactionsResult.data ?? [], viewerId);
  const commentsByPost = new Map<string, FeedComment[]>();
  for (const comment of commentRows) {
    const list = commentsByPost.get(comment.post_id) ?? [];
    list.push({
      id: comment.id,
      authorId: comment.author_id,
      authorName: nameOf(comment.author_id),
      body: comment.body,
      createdAt: comment.created_at,
      removed: comment.removed_at !== null,
    });
    commentsByPost.set(comment.post_id, list);
  }

  return {
    posts: rows.map((post) => ({
      id: post.id,
      authorId: post.author_id,
      authorName: nameOf(post.author_id),
      body: post.body,
      milestoneDays: post.milestone_days,
      createdAt: post.created_at,
      removed: post.removed_at !== null,
      reactions: reactions.get(post.id) ?? emptyReactionSummary(),
      comments: commentsByPost.get(post.id) ?? [],
    })),
    hasOlder: postRows.length > PAGE_SIZE,
    error: Boolean(commentsResult.error || reactionsResult.error),
  };
}
