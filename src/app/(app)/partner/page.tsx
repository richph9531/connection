import { CancelRequestButton, RespondButtons } from "@/components/partner/request-buttons";
import { PartnerCard } from "@/components/partner/partner-card";
import { RequestPartnerForm } from "@/components/partner/request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPartnerPage } from "@/lib/partner/data";
import { requireProfile } from "@/lib/profile";

export const metadata = { title: "Accountability partner · Connection" };

export default async function PartnerPage() {
  const { supabase, user } = await requireProfile();
  const { active, incoming, outgoing } = await loadPartnerPage(supabase, user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Accountability partner</h1>
        <p className="text-sm text-muted-foreground">
          Support each other one-on-one. Partners see each other&apos;s streak and shared check-ins (clean day, mood,
          urge level and triggers). Your journal notes are never shared.
        </p>
      </div>

      {incoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Partner requests</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {incoming.map((request) => (
                <li key={request.id} className="flex flex-col gap-2" data-testid="incoming-request">
                  <p className="text-sm">
                    <span className="font-medium [overflow-wrap:anywhere]">{request.otherName}</span> would like to be your accountability
                    partner.
                  </p>
                  <RespondButtons partnershipId={request.id} name={request.otherName} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {active.map((partner) => (
        <PartnerCard key={partner.id} partner={partner} />
      ))}

      {outgoing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Requests you sent</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {outgoing.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-2" data-testid="outgoing-request">
                  <p className="min-w-0 text-sm">
                    Waiting for <span className="font-medium [overflow-wrap:anywhere]">{request.otherName}</span> to answer.
                  </p>
                  <CancelRequestButton partnershipId={request.id} name={request.otherName} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{active.length > 0 ? "Add another partner" : "Find a partner"}</h2>
          </CardTitle>
          <CardDescription>
            {active.length > 0
              ? "You can ask another member to support you too."
              : "Recovery is easier together. Ask a member you trust by entering their display name."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestPartnerForm />
        </CardContent>
      </Card>
    </div>
  );
}
