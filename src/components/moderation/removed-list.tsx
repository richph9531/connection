import { restoreContent } from "@/app/(app)/moderation/actions";
import { formatDate } from "@/lib/moderation/format";
import type { RemovedItem } from "@/lib/moderation/queries";
import { ActionButton } from "./action-button";

export function RemovedList({ items, timeZone }: { items: RemovedItem[]; timeZone: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Nothing has been removed.</p>;
  return (
    <ul className="flex flex-col divide-y rounded-lg border" aria-label="Removed posts and comments">
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}`} className="flex flex-col gap-2 p-3" data-testid="removed-item">
          <p className="text-xs text-muted-foreground">
            {item.kind === "post" ? "Post" : "Comment"} by {item.authorName} · removed {formatDate(item.removedAt, timeZone)}
          </p>
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm">{item.body}</p>
          <div className="self-start">
            <ActionButton
              action={restoreContent}
              fields={{ kind: item.kind, targetId: item.id }}
              label="Restore"
              pendingLabel="Restoring…"
              accessibleLabel={`Restore ${item.kind} by ${item.authorName}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
