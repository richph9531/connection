import { describe, expect, it } from "vitest";
import { groupReports, reportTarget } from "./reports";

const report = (id: string, target: { post_id?: string; comment_id?: string }, created_at: string, reason = "unkind") => ({
  id,
  post_id: target.post_id ?? null,
  comment_id: target.comment_id ?? null,
  reason,
  created_at,
  reported_author_id: "author",
});

describe("reportTarget", () => {
  it("points at the post or the comment", () => {
    expect(reportTarget({ post_id: "p1", comment_id: null })).toEqual({ kind: "post", id: "p1" });
    expect(reportTarget({ post_id: null, comment_id: "c1" })).toEqual({ kind: "comment", id: "c1" });
    expect(reportTarget({ post_id: null, comment_id: null })).toBeNull();
  });
});

describe("groupReports", () => {
  it("combines reports about the same content and lists the oldest first", () => {
    const groups = groupReports([
      report("r1", { post_id: "p1" }, "2026-11-20T10:00:00Z", "spam"),
      report("r2", { comment_id: "c1" }, "2026-11-19T10:00:00Z"),
      report("r3", { post_id: "p1" }, "2026-11-18T10:00:00Z", "shaming"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ kind: "post", id: "p1", reportIds: ["r1", "r3"], reasons: ["spam", "shaming"] });
    expect(groups[0].firstReportedAt).toBe("2026-11-18T10:00:00Z");
    expect(groups[1]).toMatchObject({ kind: "comment", id: "c1", reportIds: ["r2"] });
  });

  it("keeps a post and a comment with the same id apart", () => {
    const groups = groupReports([
      report("r1", { post_id: "x" }, "2026-11-20T10:00:00Z"),
      report("r2", { comment_id: "x" }, "2026-11-20T11:00:00Z"),
    ]);
    expect(groups.map((g) => g.kind)).toEqual(["post", "comment"]);
  });

  it("returns nothing for no reports", () => {
    expect(groupReports([])).toEqual([]);
  });
});
