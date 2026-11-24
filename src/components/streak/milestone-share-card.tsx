"use client";

import { useActionState } from "react";
import { PartyPopper } from "lucide-react";
import { dismissMilestone, shareMilestone, type ShareState } from "@/app/(app)/streak/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDays, milestoneShareText } from "@/lib/streak/streak";

export function MilestoneShareCard({ days, shared: alreadyShared }: { days: number; shared: boolean }) {
  const [state, formAction, pending] = useActionState<ShareState, FormData>(shareMilestone, {});
  const shared = alreadyShared || state.status === "shared";

  return (
    <Card className="ring-emerald-500/50" data-testid="milestone-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="size-4 text-emerald-600" aria-hidden />
          <h2>You reached {formatDays(days)}!</h2>
        </CardTitle>
        <CardDescription>
          {shared
            ? "You shared this with the community. Thank you for inspiring others."
            : "That's a real achievement. Would you like to share it with the community? It's completely optional."}
        </CardDescription>
      </CardHeader>
      {!shared && (
        <CardContent>
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="days" value={days} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="milestone-body">Your message</Label>
              <Textarea id="milestone-body" name="body" required maxLength={2000} defaultValue={milestoneShareText(days)} />
              <p className="text-xs text-muted-foreground">Shared under your display name. Your check-ins and notes stay private.</p>
            </div>
            {state.message && (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Sharing…" : "Share with the community"}
              </Button>
              <Button type="submit" variant="ghost" formAction={dismissMilestone} formNoValidate disabled={pending}>
                Not now
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
