"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ mode }: { mode: "login" | "join" }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-lg bg-muted p-4 text-sm">
        Check your email. If you&apos;re a member, we&apos;ve sent you a link to log in. You can close this page.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />
      {mode === "join" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="inviteCode">Invite code</Label>
          <Input id="inviteCode" name="inviteCode" required autoComplete="off" autoCapitalize="characters" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        <p className="text-xs text-muted-foreground">Only used to log in. Other members never see it.</p>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : mode === "join" ? "Join Connection" : "Email me a login link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "join" ? (
          <Link href="/login" className="underline underline-offset-4">Already a member? Log in</Link>
        ) : (
          <Link href="/login?mode=join" className="underline underline-offset-4">I have an invite code</Link>
        )}
      </p>
    </form>
  );
}
