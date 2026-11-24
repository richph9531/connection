"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost, type FormState } from "@/app/(app)/feed/actions";
import { POST_MAX_LENGTH } from "@/lib/feed/validation";

export function ComposeForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createPost,
    {},
  );
  const [length, setLength] = useState(0);

  return (
    <form
      action={formAction}
      onSubmit={() => setLength(0)}
      className="flex flex-col gap-2"
    >
      <Label htmlFor="post-body">Share your progress</Label>
      <Textarea
        id="post-body"
        name="body"
        required
        maxLength={POST_MAX_LENGTH}
        rows={3}
        placeholder="How are you doing today? Wins, struggles and lessons are all welcome."
        onChange={(event) => setLength(event.target.value.length)}
        aria-describedby="post-body-hint"
      />
      <div className="flex items-start justify-between gap-3">
        <p id="post-body-hint" className="text-xs text-muted-foreground">
          Visible to all members. Please leave out real names and anything that
          could identify you.
        </p>
        <span
          className="shrink-0 text-xs tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {length}/{POST_MAX_LENGTH}
        </span>
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="self-end px-5"
      >
        {pending ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
