"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/(app)/moderation/actions";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  accessibleLabel?: string;
};

export function ActionButton({ action, fields, label, pendingLabel, variant = "outline", accessibleLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  return (
    <form action={formAction} className="flex flex-col gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant={variant} size="lg" disabled={pending} aria-label={accessibleLabel}>
        {pending ? pendingLabel : label}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
