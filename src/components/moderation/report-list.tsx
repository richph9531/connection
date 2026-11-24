import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { decideReport } from "@/app/(app)/moderation/actions";
import { formatDate, plural } from "@/lib/moderation/format";
import type { ReportItem } from "@/lib/moderation/queries";
import { ActionButton } from "./action-button";

export function ReportList({ reports, timeZone }: { reports: ReportItem[]; timeZone: string }) {
  if (!reports.length) {
    return (
      <p className="rounded-lg bg-muted p-4 text-sm" data-testid="no-reports">
        Nothing to review right now. Thank you for looking after the community.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Open reports">
      {reports.map((report) => {
        const fields = { kind: report.kind, targetId: report.id, reportIds: report.reportIds.join(",") };
        const what = report.kind === "post" ? "Post" : "Comment";
        return (
          <li key={`${report.kind}:${report.id}`}>
            <Card size="sm" data-testid="report">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span>
                    {what} by {report.authorName}
                  </span>
                  <Badge variant="secondary">{plural(report.reportIds.length, "report")}</Badge>
                  {report.removedAt && <Badge variant="outline">Already removed</Badge>}
                </CardTitle>
                <CardDescription>First reported {formatDate(report.firstReportedAt, timeZone)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <blockquote className="whitespace-pre-wrap break-words rounded-md border-l-4 border-muted-foreground/30 bg-muted/50 p-3">
                  {report.body ?? "This content is no longer available."}
                </blockquote>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Why members reported it</p>
                  <ul className="mt-1 list-disc pl-5">
                    {report.reasons.map((reason, index) => (
                      <li key={index} className="break-words">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {report.removedAt ? (
                    <>
                      <ActionButton
                        action={decideReport}
                        fields={{ ...fields, decision: "resolve" }}
                        label="Keep removed"
                        pendingLabel="Saving…"
                        variant="default"
                      />
                      <ActionButton
                        action={decideReport}
                        fields={{ ...fields, decision: "restore" }}
                        label="Restore"
                        pendingLabel="Restoring…"
                      />
                    </>
                  ) : (
                    <>
                      <ActionButton
                        action={decideReport}
                        fields={{ ...fields, decision: "remove" }}
                        label={`Remove ${what.toLowerCase()}`}
                        pendingLabel="Removing…"
                        variant="destructive"
                      />
                      <ActionButton
                        action={decideReport}
                        fields={{ ...fields, decision: "dismiss" }}
                        label="Dismiss"
                        pendingLabel="Dismissing…"
                        accessibleLabel={`Dismiss reports about this ${what.toLowerCase()}`}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
