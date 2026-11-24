"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reportContent, type FormState } from "@/app/(app)/feed/actions";
import { REPORT_REASON_MAX_LENGTH } from "@/lib/feed/validation";

export function ReportButton({
  target,
  targetId,
}: {
  target: "post" | "comment";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    reportContent,
    {},
  );
  const fieldId = `report-${targetId}`;

  if (state.ok) {
    return (
      <p role="status" className="text-xs text-muted-foreground">
        Thank you. A moderator will take a look.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        Report {target}
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-2 rounded-lg bg-muted/50 p-3"
    >
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetId" value={targetId} />
      <Label htmlFor={fieldId}>What&apos;s the concern?</Label>
      <Textarea
        id={fieldId}
        name="reason"
        required
        maxLength={REPORT_REASON_MAX_LENGTH}
        rows={2}
      />
      <p className="text-xs text-muted-foreground">
        Only moderators see reports. The author won&apos;t know who sent it.
      </p>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Sending…" : "Send report"}
        </Button>
      </div>
    </form>
  );
}
