import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivePartner } from "@/lib/partner/data";
import { SHARED_DAYS } from "@/lib/partner/partnerships";
import { formatDays } from "@/lib/partner/streak";
import { EndPartnershipButton } from "./end-partnership";
import { SharedCheckIns } from "./shared-check-ins";

export function PartnerCard({ partner }: { partner: ActivePartner }) {
  const latest = partner.checkIns[0];
  return (
    <Card data-testid="partner-card">
      <CardHeader>
        <CardTitle>
          <h2 className="[overflow-wrap:anywhere]">{partner.otherName}</h2>
        </CardTitle>
        <CardDescription>Your accountability partner</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Current streak</dt>
            <dd className="text-lg font-semibold" data-testid="partner-streak">
              {formatDays(partner.streak.current)}
            </dd>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Longest streak</dt>
            <dd className="text-lg font-semibold">{formatDays(partner.streak.longest)}</dd>
          </div>
        </dl>
        {latest && !latest.clean && (
          <p className="rounded-lg bg-muted p-3 text-sm">
            {partner.otherName} had a tough day recently. Every day is a fresh start, and a little encouragement
            from you can go a long way.
          </p>
        )}
        <section className="flex flex-col gap-1" aria-label={`${partner.otherName}'s shared check-ins`}>
          <h3 className="font-medium">Shared check-ins</h3>
          <SharedCheckIns checkIns={partner.checkIns} today={partner.today} days={SHARED_DAYS} />
        </section>
        <EndPartnershipButton otherId={partner.otherId} name={partner.otherName} />
      </CardContent>
    </Card>
  );
}
