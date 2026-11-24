"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayIn } from "@/lib/dates";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, {});
  const [timezone, setTimezone] = useState(state.values?.timezone ?? "UTC");
  const [zones, setZones] = useState<string[]>([]);
  const [recoveryStartDate, setRecoveryStartDate] = useState("");

  useEffect(() => {
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setZones(Intl.supportedValuesOf("timeZone"));
    setTimezone(deviceZone);
    setRecoveryStartDate(todayIn(deviceZone));
  }, []);

  // React resets the form after each submission; remount the select so it shows the kept value.
  const [submissions, setSubmissions] = useState(0);
  useEffect(() => {
    if (!state.values) return;
    setTimezone(state.values.timezone);
    setRecoveryStartDate(state.values.recoveryStartDate);
    setSubmissions((count) => count + 1);
  }, [state]);

  const today = todayIn(timezone);
  const zoneOptions = zones.includes(timezone) ? zones : [timezone, ...zones];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          minLength={3}
          maxLength={30}
          autoComplete="off"
          defaultValue={state.values?.displayName}
          key={state.values?.displayName}
        />
        <p className="text-xs text-muted-foreground">
          This is how other members will see you. Please don&apos;t use your real name.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="recoveryStartDate">When did your current recovery start?</Label>
        <Input
          id="recoveryStartDate"
          name="recoveryStartDate"
          type="date"
          required
          max={today}
          value={recoveryStartDate}
          onChange={(event) => setRecoveryStartDate(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Your streak counts from this day. You can change it later.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timezone">Your time zone</Label>
        <select
          key={submissions}
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {zoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Used to decide when your day starts and ends.</p>
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
