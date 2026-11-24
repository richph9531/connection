"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComment, type FormState } from "@/app/(app)/feed/actions";
import { COMMENT_MAX_LENGTH } from "@/lib/feed/validation";
import { DeleteButton } from "./delete-button";
import { ReportButton } from "./report-form";

export type CommentView = {
  id: string;
  authorName: string;
  body: string;
  time: string;
  mine: boolean;
  removed: boolean;
};

export function CommentSection({
  postId,
  comments,
  canReply,
}: {
  postId: string;
  comments: CommentView[];
  canReply: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createComment,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = `comment-${postId}`;
  const listId = `comments-${postId}`;

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const count = comments.length;
  const toggleLabel = open
    ? "Hide replies"
    : count === 0
      ? "Reply"
      : count === 1
        ? "1 reply"
        : `${count} replies`;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="self-start"
      >
        {toggleLabel}
      </Button>
      {open && (
        <div
          id={listId}
          className="flex flex-col gap-3 border-l-2 border-muted pl-3"
        >
          {count > 0 && (
            <ul className="flex flex-col gap-3" aria-label="Replies">
              {comments.map((comment) => (
                <li key={comment.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-medium">{comment.authorName}</span>
                    <span className="text-muted-foreground">
                      {comment.time}
                    </span>
                  </div>
                  {comment.removed && (
                    <p className="text-xs text-muted-foreground">
                      A moderator hid this reply. Only you can see it.
                    </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {comment.body}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    {comment.mine ? (
                      <DeleteButton target="comment" targetId={comment.id} />
                    ) : (
                      <ReportButton target="comment" targetId={comment.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canReply ? (
            <form
              ref={formRef}
              action={formAction}
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="postId" value={postId} />
              <Label htmlFor={fieldId}>Write an encouraging reply</Label>
              <Textarea
                id={fieldId}
                name="body"
                required
                maxLength={COMMENT_MAX_LENGTH}
                rows={2}
              />
              {state.message && (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={pending}
                className="self-end px-4"
              >
                {pending ? "Sending…" : "Send reply"}
              </Button>
            </form>
          ) : (
            count === 0 && (
              <p className="text-xs text-muted-foreground">
                Replies are closed on this post.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
