"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETE_CONFIRMATION_PHRASE, isDeleteConfirmed } from "@/lib/account/confirmation";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (!open) {
    return (
      <Button type="button" variant="destructive" size="lg" onClick={() => setOpen(true)}>
        Delete my account…
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-sm">
        <p>This will permanently delete:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>your profile and login</li>
          <li>all your check-ins and private notes</li>
          <li>your posts, comments and reactions</li>
          <li>any accountability partnerships</li>
        </ul>
        <p className="text-muted-foreground">
          You might like to download your data first. If you ever want to come back, you&apos;ll be welcome with a
          new invite.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmation">Type {DELETE_CONFIRMATION_PHRASE} to confirm</Label>
        <Input
          id="confirmation"
          name="confirmation"
          autoComplete="off"
          autoCapitalize="characters"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          variant="destructive"
          size="lg"
          disabled={pending || !isDeleteConfirmed(confirmation)}
        >
          {pending ? "Deleting…" : "Permanently delete my account"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setConfirmation("");
          }}
        >
          Keep my account
        </Button>
      </div>
    </form>
  );
}
