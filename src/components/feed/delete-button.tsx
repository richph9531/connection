"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteComment, deletePost } from "@/app/(app)/feed/actions";

export function DeleteButton({
  target,
  targetId,
}: {
  target: "post" | "comment";
  targetId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result =
        target === "post"
          ? await deletePost(targetId)
          : await deleteComment(targetId);
      if (result.message) setMessage(result.message);
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setConfirming(true)}
          className="text-muted-foreground"
        >
          Delete {target}
        </Button>
        {message && (
          <span role="alert" className="text-xs text-destructive">
            {message}
          </span>
        )}
      </>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs">Delete this {target}?</span>
      <Button
        type="button"
        variant="destructive"
        size="xs"
        disabled={pending}
        onClick={onDelete}
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => setConfirming(false)}
      >
        Keep
      </Button>
    </span>
  );
}
