"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createInvite, type InviteState } from "@/app/(app)/moderation/actions";
import { DEFAULT_INVITE_EXPIRY_DAYS, INVITE_EXPIRY_OPTIONS } from "@/lib/moderation/invites";
import { plural } from "@/lib/moderation/format";

export function CreateInviteForm() {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(createInvite, { status: "idle" });
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(code: string, joinUrl: string) {
    try {
      await navigator.clipboard.writeText(`Your invite code for Connection: ${code}\nJoin here: ${joinUrl}`);
      setCopied(code);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="days">Invite lasts for</Label>
          <select
            id="days"
            name="days"
            defaultValue={DEFAULT_INVITE_EXPIRY_DAYS}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            {INVITE_EXPIRY_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {plural(days, "day")}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating…" : "Create invite"}
        </Button>
      </form>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "ok" && state.code && (
        <div role="status" className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm">
          <p>New invite ready. Share it privately with the person you&apos;re inviting:</p>
          <p className="font-mono text-lg font-semibold tracking-wider" data-testid="new-invite-code">
            {state.code}
          </p>
          <p className="break-all text-xs text-muted-foreground">They join at {state.joinUrl}</p>
          <Button type="button" variant="outline" size="lg" onClick={() => copy(state.code!, state.joinUrl!)}>
            {copied === state.code ? "Copied" : "Copy invite message"}
          </Button>
        </div>
      )}
    </div>
  );
}
