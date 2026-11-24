"use client";

import { useActionState } from "react";
import { endPartnership, respondToRequest, type PartnerActionState } from "@/app/(app)/partner/actions";
import { Button } from "@/components/ui/button";

const idle: PartnerActionState = { status: "idle" };

function ErrorMessage({ state }: { state: PartnerActionState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {state.message}
    </p>
  );
}

export function RespondButtons({ partnershipId, name }: { partnershipId: string; name: string }) {
  const [state, formAction, pending] = useActionState(respondToRequest, idle);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="partnershipId" value={partnershipId} />
      <div className="flex gap-2">
        <Button type="submit" name="answer" value="accept" disabled={pending} aria-label={`Accept ${name}`} className="flex-1">
          Accept
        </Button>
        <Button
          type="submit"
          name="answer"
          value="decline"
          variant="outline"
          disabled={pending}
          aria-label={`Decline ${name}`}
          className="flex-1"
        >
          Decline
        </Button>
      </div>
      <ErrorMessage state={state} />
    </form>
  );
}

export function CancelRequestButton({ otherId, name }: { otherId: string; name: string }) {
  const [state, formAction, pending] = useActionState(endPartnership, idle);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="otherId" value={otherId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending} aria-label={`Cancel request to ${name}`}>
        Cancel request
      </Button>
      <ErrorMessage state={state} />
    </form>
  );
}
