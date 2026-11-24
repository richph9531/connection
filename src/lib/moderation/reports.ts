export type ReportRow = {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  created_at: string;
};

export type ReportTarget = { kind: "post" | "comment"; id: string };

export type ReportGroup = ReportTarget & {
  reportIds: string[];
  reasons: string[];
  firstReportedAt: string;
};

export function reportTarget(report: Pick<ReportRow, "post_id" | "comment_id">): ReportTarget | null {
  if (report.post_id) return { kind: "post", id: report.post_id };
  if (report.comment_id) return { kind: "comment", id: report.comment_id };
  return null;
}

/** Combines several reports about the same post or comment into one item, oldest first. */
export function groupReports(reports: ReportRow[]): ReportGroup[] {
  const groups = new Map<string, ReportGroup>();
  for (const report of reports) {
    const target = reportTarget(report);
    if (!target) continue;
    const key = `${target.kind}:${target.id}`;
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { ...target, reportIds: [report.id], reasons: [report.reason], firstReportedAt: report.created_at });
      continue;
    }
    group.reportIds.push(report.id);
    group.reasons.push(report.reason);
    if (report.created_at < group.firstReportedAt) group.firstReportedAt = report.created_at;
  }
  return [...groups.values()].sort((a, b) => a.firstReportedAt.localeCompare(b.firstReportedAt));
}
