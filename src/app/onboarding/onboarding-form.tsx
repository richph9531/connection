"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, {});
  const [timezone, setTimezone] = useState("UTC");
  useEffect(() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="timezone" value={timezone} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" required minLength={3} maxLength={30} autoComplete="off" />
        <p className="text-xs text-muted-foreground">
          This is how other members will see you. Please don&apos;t use your real name.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="recoveryStartDate">When did your current recovery start?</Label>
        <Input id="recoveryStartDate" name="recoveryStartDate" type="date" required max={today} defaultValue={today} />
        <p className="text-xs text-muted-foreground">Your streak counts from this day. You can change it later.</p>
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
