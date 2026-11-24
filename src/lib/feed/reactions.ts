import type { Database } from "@/lib/database.types";

export type ReactionKind = Database["public"]["Enums"]["reaction_kind"];

export const REACTION_KINDS = [
  "support",
  "strength",
  "prayer",
  "well_done",
] as const satisfies readonly ReactionKind[];

export const REACTIONS: Record<ReactionKind, { emoji: string; label: string }> =
  {
    support: { emoji: "❤️", label: "Support" },
    strength: { emoji: "💪", label: "Strength" },
    prayer: { emoji: "🙏", label: "Prayer" },
    well_done: { emoji: "👏", label: "Well done" },
  };

export type ReactionSummary = Record<
  ReactionKind,
  { count: number; mine: boolean }
>;

export function emptyReactionSummary(): ReactionSummary {
  return Object.fromEntries(
    REACTION_KINDS.map((kind) => [kind, { count: 0, mine: false }]),
  ) as ReactionSummary;
}

/** Groups reaction rows by post into per-kind counts, noting which ones are the viewer's. */
export function summarizeReactions(
  rows: { post_id: string; user_id: string; kind: ReactionKind }[],
  viewerId: string,
): Map<string, ReactionSummary> {
  const byPost = new Map<string, ReactionSummary>();
  for (const row of rows) {
    const summary = byPost.get(row.post_id) ?? emptyReactionSummary();
    summary[row.kind].count += 1;
    if (row.user_id === viewerId) summary[row.kind].mine = true;
    byPost.set(row.post_id, summary);
  }
  return byPost;
}

/** Applies the viewer toggling one reaction, for optimistic UI updates. */
export function toggleReaction(
  summary: ReactionSummary,
  kind: ReactionKind,
): ReactionSummary {
  const current = summary[kind];
  return {
    ...summary,
    [kind]: {
      count: Math.max(0, current.count + (current.mine ? -1 : 1)),
      mine: !current.mine,
    },
  };
}
