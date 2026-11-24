import { describe, expect, it } from "vitest";
import { buildMemberExport, EXPORT_FORMAT_VERSION, exportFileName, type ExportInput } from "./export";

const input: ExportInput = {
  email: "me@example.com",
  profile: {
    display_name: "Hope",
    role: "member",
    recovery_start_date: "2026-01-01",
    longest_streak: 12,
    timezone: "Africa/Johannesburg",
    created_at: "2026-01-01T08:00:00Z",
  },
  checkIns: [
    {
      date: "2026-02-02",
      clean: true,
      mood: 4,
      urge_level: 2,
      triggers: ["stress"],
      note: "second",
      share_with_partner: true,
      created_at: "2026-02-02T20:00:00Z",
      updated_at: "2026-02-02T20:00:00Z",
    },
    {
      date: "2026-02-01",
      clean: false,
      mood: 2,
      urge_level: 7,
      triggers: [],
      note: "first",
      share_with_partner: false,
      created_at: "2026-02-01T20:00:00Z",
      updated_at: "2026-02-01T20:00:00Z",
    },
  ],
  posts: [
    { id: "p2", body: "later", milestone_days: null, created_at: "2026-02-03T00:00:00Z", removed_at: null },
    { id: "p1", body: "earlier", milestone_days: 30, created_at: "2026-01-31T00:00:00Z", removed_at: null },
  ],
  comments: [{ id: "c1", post_id: "p1", body: "thanks", created_at: "2026-02-01T00:00:00Z", removed_at: null }],
};

describe("buildMemberExport", () => {
  const now = new Date("2026-03-01T12:00:00Z");
  const result = buildMemberExport(input, now);

  it("includes every section with a version and timestamp", () => {
    expect(result.format_version).toBe(EXPORT_FORMAT_VERSION);
    expect(result.exported_at).toBe("2026-03-01T12:00:00.000Z");
    expect(result.account.email).toBe("me@example.com");
    expect(result.profile.display_name).toBe("Hope");
    expect(result.check_ins).toHaveLength(2);
    expect(result.posts).toHaveLength(2);
    expect(result.comments).toHaveLength(1);
  });

  it("keeps private notes for the member's own copy", () => {
    expect(result.check_ins.map((c) => c.note)).toEqual(["first", "second"]);
  });

  it("sorts entries oldest first without mutating the input", () => {
    expect(result.check_ins.map((c) => c.date)).toEqual(["2026-02-01", "2026-02-02"]);
    expect(result.posts.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(input.checkIns[0].date).toBe("2026-02-02");
  });

  it("serialises to JSON and back unchanged", () => {
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

describe("exportFileName", () => {
  it("uses the member's own date", () => {
    const lateUtc = new Date("2026-03-01T23:30:00Z");
    expect(exportFileName("Africa/Johannesburg", lateUtc)).toBe("connection-export-2026-03-02.json");
    expect(exportFileName("America/New_York", lateUtc)).toBe("connection-export-2026-03-01.json");
  });
});
