"use client";

import { useActionState } from "react";
import { requestPartner, type PartnerActionState } from "@/app/(app)/partner/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RequestPartnerForm() {
  const [state, formAction, pending] = useActionState<PartnerActionState, FormData>(requestPartner, {
    status: "idle",
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="partnerDisplayName">Partner&apos;s display name</Label>
        <Input
          id="partnerDisplayName"
          name="displayName"
          required
          minLength={3}
          maxLength={30}
          autoComplete="off"
          autoCapitalize="none"
          key={state.status === "success" ? state.message : undefined}
        />
      </div>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        >
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
