"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOODS, NOTE_MAX_LENGTH, TRIGGERS } from "@/lib/checkin/options";
import type { CheckInFormValues } from "@/lib/checkin/schema";
import { cn } from "@/lib/utils";

type State = { status?: "saved" | "error"; message?: string; values?: CheckInFormValues; submittedAt?: number };
type Action = (prev: State, formData: FormData) => Promise<State>;

const EMPTY: CheckInFormValues = {
  clean: "",
  mood: "",
  urgeLevel: "0",
  triggers: [],
  note: "",
  shareWithPartner: true,
};

const choice =
  "flex cursor-pointer items-center justify-center rounded-lg border border-input bg-background text-sm font-medium transition-colors select-none hover:bg-muted has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-checked:hover:bg-primary/90 has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

export function CheckInForm({ action, initial }: { action: Action; initial: CheckInFormValues | null }) {
  const [state, formAction, pending] = useActionState(action, {});
  const isUpdate = Boolean(initial) || state.status === "saved";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Remount after each submission so the fields show what was just sent, even after React resets the form. */}
      <CheckInFields key={state.submittedAt ?? 0} initial={state.values ?? initial ?? EMPTY} />
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "saved" && !pending && (
        <p role="status" className="rounded-lg bg-muted p-3 text-sm">
          Check-in saved. Thank you for showing up for yourself today.
        </p>
      )}
      <Button type="submit" size="lg" className="h-11 text-base" disabled={pending}>
        {pending ? "Saving…" : isUpdate ? "Update check-in" : "Save check-in"}
      </Button>
    </form>
  );
}

function CheckInFields({ initial }: { initial: CheckInFormValues }) {
  const [values, setValues] = useState(initial);
  const set = <K extends keyof CheckInFormValues>(key: K, value: CheckInFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Did you stay clean today?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["yes", "no"] as const).map((option) => (
            <label key={option} className={cn(choice, "h-11")}>
              <input
                type="radio"
                name="clean"
                value={option}
                required
                checked={values.clean === option}
                onChange={() => set("clean", option)}
                className="sr-only"
              />
              {option === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">How is your mood?</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {MOODS.map((mood) => (
            <label key={mood.value} className={cn(choice, "h-16 flex-col gap-0.5 px-0.5")}>
              <input
                type="radio"
                name="mood"
                value={mood.value}
                required
                checked={values.mood === String(mood.value)}
                onChange={() => set("mood", String(mood.value))}
                className="sr-only"
              />
              <span aria-hidden className="text-2xl leading-none">
                {mood.face}
              </span>
              <span className="text-[0.7rem] leading-tight">{mood.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="urgeLevel">Urge level</Label>
          <span aria-hidden className="text-sm font-semibold tabular-nums">
            {values.urgeLevel} / 10
          </span>
        </div>
        <input
          id="urgeLevel"
          name="urgeLevel"
          type="range"
          min={0}
          max={10}
          step={1}
          aria-valuetext={`${values.urgeLevel} out of 10`}
          value={values.urgeLevel}
          onChange={(event) => set("urgeLevel", event.target.value)}
          className="h-8 w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground" aria-hidden>
          <span>0 · none</span>
          <span>10 · very strong</span>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Any triggers today?</legend>
        <p className="mb-1 text-xs text-muted-foreground">Choose any that apply, or none.</p>
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((trigger) => (
            <label key={trigger.value} className={cn(choice, "h-9 rounded-full px-3")}>
              <input
                type="checkbox"
                name="triggers"
                value={trigger.value}
                checked={values.triggers.includes(trigger.value)}
                onChange={(event) =>
                  set(
                    "triggers",
                    event.target.checked
                      ? [...values.triggers, trigger.value]
                      : values.triggers.filter((value) => value !== trigger.value),
                  )
                }
                className="sr-only"
              />
              {trigger.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Private journal note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          value={values.note}
          onChange={(event) => set("note", event.target.value)}
          aria-describedby="note-hint"
        />
        <p id="note-hint" className="text-xs text-muted-foreground">
          Only you can see this. It is never shared, not even with your partner.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="shareWithPartner"
          name="shareWithPartner"
          type="checkbox"
          checked={values.shareWithPartner}
          onChange={(event) => set("shareWithPartner", event.target.checked)}
          aria-describedby="share-hint"
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor="shareWithPartner" className="leading-snug">
            Share this check-in with my accountability partner
          </Label>
          <p id="share-hint" className="text-xs text-muted-foreground">
            Your partner sees whether you stayed clean, your mood, urge level and triggers. Never your note.
          </p>
        </div>
      </div>
    </>
  );
}
