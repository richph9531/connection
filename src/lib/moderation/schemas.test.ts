import { describe, expect, it } from "vitest";
import { createInviteSchema, reportActionSchema, setRoleSchema } from "./schemas";
import { formatDate, plural } from "./format";

const id = "00000000-0000-4000-8000-000000000001";

describe("schemas", () => {
  it("accepts only the offered invite lengths", () => {
    expect(createInviteSchema.parse({ days: "7" })).toEqual({ days: 7 });
    expect(createInviteSchema.safeParse({ days: "365" }).success).toBe(false);
    expect(createInviteSchema.safeParse({ days: "abc" }).success).toBe(false);
  });

  it("validates report decisions", () => {
    const reportIds = id;
    expect(reportActionSchema.safeParse({ kind: "post", targetId: id, decision: "remove", reportIds }).success).toBe(true);
    expect(reportActionSchema.safeParse({ kind: "profile", targetId: id, decision: "remove", reportIds }).success).toBe(false);
    expect(
      reportActionSchema.safeParse({ kind: "post", targetId: "not-a-uuid", decision: "remove", reportIds }).success,
    ).toBe(false);
    expect(reportActionSchema.safeParse({ kind: "post", targetId: id, decision: "delete", reportIds }).success).toBe(false);
  });

  it("closes only the reports that were shown", () => {
    const other = "00000000-0000-4000-8000-000000000002";
    expect(
      reportActionSchema.parse({ kind: "post", targetId: id, decision: "dismiss", reportIds: `${id},${other}` }).reportIds,
    ).toEqual([id, other]);
    expect(reportActionSchema.safeParse({ kind: "post", targetId: id, decision: "dismiss", reportIds: "" }).success).toBe(
      false,
    );
    expect(
      reportActionSchema.safeParse({ kind: "post", targetId: id, decision: "dismiss", reportIds: "nope" }).success,
    ).toBe(false);
  });

  it("validates roles", () => {
    expect(setRoleSchema.safeParse({ memberId: id, role: "moderator" }).success).toBe(true);
    expect(setRoleSchema.safeParse({ memberId: id, role: "owner" }).success).toBe(false);
  });
});

describe("format", () => {
  it("formats dates in the viewer's own time zone", () => {
    expect(formatDate("2026-11-24T23:30:00Z", "UTC")).toBe("24 Nov 2026");
    expect(formatDate("2026-11-24T23:30:00Z", "Africa/Johannesburg")).toBe("25 Nov 2026");
  });

  it("pluralises", () => {
    expect(plural(1, "report")).toBe("1 report");
    expect(plural(3, "report")).toBe("3 reports");
  });
});
