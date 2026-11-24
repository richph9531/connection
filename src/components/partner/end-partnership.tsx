"use client";

import { useActionState, useState } from "react";
import { endPartnership, type PartnerActionState } from "@/app/(app)/partner/actions";
import { Button } from "@/components/ui/button";

export function EndPartnershipButton({ otherId, name }: { otherId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<PartnerActionState, FormData>(endPartnership, {
    status: "idle",
  });

  if (!confirming) {
    return (
      <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
        End partnership
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-3">
      <input type="hidden" name="otherId" value={otherId} />
      <p className="text-sm">
        End your partnership with {name}? You&apos;ll both stop seeing each other&apos;s check-ins and streak. You
        can always partner up again later.
      </p>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={pending} className="flex-1">
          {pending ? "Ending…" : "Yes, end it"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="flex-1">
          Keep partnership
        </Button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
