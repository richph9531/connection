import { describe, expect, it } from "vitest";
import {
  checkNewRequest,
  escapeLike,
  groupPartnerships,
  pickMember,
  requestPartnerSchema,
  type PartnershipRow,
} from "./partnerships";

const ME = "me";
const names = new Map([
  ["ann", "Ann"],
  ["ben", "Ben"],
  ["cat", "Cat"],
  ["dan", "Dan"],
]);

function row(id: string, requester_id: string, partner_id: string, status: PartnershipRow["status"], created_at = "2026-11-20T10:00:00Z"): PartnershipRow {
  return { id, requester_id, partner_id, status, created_at };
}

describe("groupPartnerships", () => {
  it("splits active partners, incoming and outgoing requests", () => {
    const grouped = groupPartnerships(
      [
        row("1", ME, "ann", "active"),
        row("2", "ben", ME, "pending"),
        row("3", ME, "cat", "pending"),
        row("4", "dan", ME, "ended"),
      ],
      ME,
      names,
    );
    expect(grouped.active.map((link) => link.otherName)).toEqual(["Ann"]);
    expect(grouped.incoming.map((link) => link.otherName)).toEqual(["Ben"]);
    expect(grouped.outgoing.map((link) => link.otherName)).toEqual(["Cat"]);
  });

  it("shows each member once, preferring an active partnership", () => {
    const grouped = groupPartnerships(
      [row("1", "ann", ME, "pending", "2026-11-22T00:00:00Z"), row("2", ME, "ann", "active"), row("3", ME, "ann", "active")],
      ME,
      names,
    );
    expect(grouped.active).toHaveLength(1);
    expect(grouped.incoming).toHaveLength(0);
  });

  it("skips members without a directory entry (e.g. deleted accounts)", () => {
    expect(groupPartnerships([row("1", ME, "ghost", "active")], ME, names).active).toHaveLength(0);
  });
});

describe("checkNewRequest", () => {
  it("allows a first request", () => {
    expect(checkNewRequest([], ME, "ann")).toEqual({ ok: true });
  });

  it("allows asking again after a request was declined or a partnership ended", () => {
    expect(checkNewRequest([row("1", ME, "ann", "declined"), row("2", "ann", ME, "ended")], ME, "ann")).toEqual({ ok: true });
  });

  it("blocks requests to yourself and duplicates", () => {
    expect(checkNewRequest([], ME, ME)).toEqual({ ok: false, reason: "self" });
    expect(checkNewRequest([row("1", "ann", ME, "active")], ME, "ann")).toEqual({ ok: false, reason: "already-partners" });
    expect(checkNewRequest([row("1", ME, "ann", "pending")], ME, "ann")).toEqual({ ok: false, reason: "already-requested" });
    expect(checkNewRequest([row("1", "ann", ME, "pending")], ME, "ann")).toEqual({ ok: false, reason: "they-requested" });
  });

  it("ignores partnerships with other members", () => {
    expect(checkNewRequest([row("1", ME, "ben", "active")], ME, "ann")).toEqual({ ok: true });
  });
});

describe("pickMember", () => {
  const members = [
    { id: "1", display_name: "Sam" },
    { id: "2", display_name: "sam" },
    { id: "3", display_name: "River_1" },
  ];

  it("prefers an exact match", () => {
    expect(pickMember(members, "sam")?.id).toBe("2");
  });

  it("accepts a unique case-insensitive match", () => {
    expect(pickMember(members, "river_1")?.id).toBe("3");
  });

  it("refuses ambiguous or missing matches", () => {
    expect(pickMember(members, "SAM")).toBeUndefined();
    expect(pickMember(members, "Nobody")).toBeUndefined();
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards", () => {
    expect(escapeLike("River_1")).toBe("River\\_1");
    expect(escapeLike("50%")).toBe("50\\%");
  });
});

describe("requestPartnerSchema", () => {
  it("trims and validates display names", () => {
    expect(requestPartnerSchema.parse({ displayName: "  Ann B  " })).toEqual({ displayName: "Ann B" });
    expect(requestPartnerSchema.safeParse({ displayName: "a" }).success).toBe(false);
  });
});
