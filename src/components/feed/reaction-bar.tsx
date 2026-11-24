"use client";

import { useOptimistic, useTransition } from "react";
import { setReaction } from "@/app/(app)/feed/actions";
import {
  REACTION_KINDS,
  REACTIONS,
  toggleReaction,
  type ReactionKind,
  type ReactionSummary,
} from "@/lib/feed/reactions";
import { cn } from "@/lib/utils";

export function ReactionBar({
  postId,
  reactions,
  disabled,
}: {
  postId: string;
  reactions: ReactionSummary;
  disabled?: boolean;
}) {
  const [optimistic, applyToggle] = useOptimistic(reactions, toggleReaction);
  const [, startTransition] = useTransition();

  function onToggle(kind: ReactionKind) {
    const on = !optimistic[kind].mine;
    startTransition(async () => {
      applyToggle(kind);
      await setReaction(postId, kind, on);
    });
  }

  return (
    <div
      role="group"
      aria-label="Encouragement"
      className="flex flex-wrap gap-1.5"
    >
      {REACTION_KINDS.map((kind) => {
        const { emoji, label } = REACTIONS[kind];
        const { count, mine } = optimistic[kind];
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            aria-pressed={mine}
            aria-label={`${label}: ${count}`}
            title={label}
            onClick={() => onToggle(kind)}
            className={cn(
              "inline-flex h-9 min-w-11 items-center justify-center gap-1 rounded-full border px-2.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
              mine
                ? "border-primary/40 bg-primary/10 font-medium"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="hidden text-xs sm:inline">{label}</span>
            {count > 0 && <span className="tabular-nums text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
