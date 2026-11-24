import { Badge } from "@/components/ui/badge";
import { withdrawInvite } from "@/app/(app)/moderation/actions";
import { formatDate } from "@/lib/moderation/format";
import { groupInvites, type InviteStatus } from "@/lib/moderation/invites";
import type { InviteItem } from "@/lib/moderation/queries";
import { ActionButton } from "./action-button";

const SECTIONS: { status: InviteStatus; title: string; empty: string }[] = [
  { status: "unused", title: "Unused", empty: "No unused invites." },
  { status: "used", title: "Used", empty: "No one has joined with an invite yet." },
  { status: "expired", title: "Expired", empty: "No expired invites." },
];

export function InviteList({ invites, timeZone, now }: { invites: InviteItem[]; timeZone: string; now: Date }) {
  const groups = groupInvites(invites, now);
  return (
    <div className="flex flex-col gap-5">
      {SECTIONS.map(({ status, title, empty }) => (
        <section key={status} aria-labelledby={`invites-${status}`} className="flex flex-col gap-2">
          <h3 id={`invites-${status}`} className="flex items-center gap-2 text-sm font-semibold">
            {title} <Badge variant="secondary">{groups[status].length}</Badge>
          </h3>
          {groups[status].length === 0 ? (
            <p className="text-sm text-muted-foreground">{empty}</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border" data-testid={`invites-${status}`}>
              {groups[status].map((invite) => (
                <li key={invite.code} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="break-all font-mono text-sm font-medium">{invite.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {status === "used"
                        ? `Used by ${invite.usedByName}${invite.used_at ? ` on ${formatDate(invite.used_at, timeZone)}` : ""}`
                        : status === "expired"
                          ? `Expired ${formatDate(invite.expires_at, timeZone)}`
                          : `Expires ${formatDate(invite.expires_at, timeZone)}`}
                      {invite.createdByName ? ` · created by ${invite.createdByName}` : ""}
                    </span>
                  </div>
                  {status !== "used" && (
                    <ActionButton
                      action={withdrawInvite}
                      fields={{ code: invite.code }}
                      label={status === "expired" ? "Delete" : "Withdraw"}
                      pendingLabel="Removing…"
                      variant="ghost"
                      accessibleLabel={`${status === "expired" ? "Delete" : "Withdraw"} invite ${invite.code}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
