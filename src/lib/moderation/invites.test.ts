import { describe, expect, it } from "vitest";
import { inviteCodeSchema } from "@/lib/validation";
import { INVITE_CODE_ALPHABET, generateInviteCode, groupInvites, inviteExpiry, inviteStatus } from "./invites";

const now = new Date("2026-11-24T12:00:00Z");

describe("generateInviteCode", () => {
  it("makes a readable three-part code that the join form accepts", () => {
    const code = generateInviteCode((size) => Uint8Array.from({ length: size }, (_, i) => i * 7));
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(inviteCodeSchema.parse(code)).toBe(code);
  });

  it("never uses look-alike characters", () => {
    expect(INVITE_CODE_ALPHABET).not.toMatch(/[01IO]/);
    const code = generateInviteCode((size) => Uint8Array.from({ length: size }, () => 255));
    expect(code).not.toMatch(/[01IO]/);
  });

  it("produces different codes for different random bytes", () => {
    const a = generateInviteCode((size) => new Uint8Array(size).fill(1));
    const b = generateInviteCode((size) => new Uint8Array(size).fill(2));
    expect(a).not.toBe(b);
  });
});

describe("inviteExpiry", () => {
  it("adds whole days", () => {
    expect(inviteExpiry(14, now)).toBe("2026-12-08T12:00:00.000Z");
  });
});

describe("inviteStatus", () => {
  it("is used once someone has joined, even after it expires", () => {
    expect(inviteStatus({ used_at: "2026-11-01T00:00:00Z", expires_at: "2026-11-02T00:00:00Z" }, now)).toBe("used");
  });

  it("is expired when the expiry time has passed", () => {
    expect(inviteStatus({ used_at: null, expires_at: "2026-11-24T12:00:00Z" }, now)).toBe("expired");
  });

  it("is unused while still valid", () => {
    expect(inviteStatus({ used_at: null, expires_at: "2026-11-24T12:00:01Z" }, now)).toBe("unused");
  });
});

describe("groupInvites", () => {
  it("sorts invites into used, unused and expired, keeping order", () => {
    const invites = [
      { code: "A", used_at: null, expires_at: "2026-12-01T00:00:00Z" },
      { code: "B", used_at: "2026-11-20T00:00:00Z", expires_at: "2026-12-01T00:00:00Z" },
      { code: "C", used_at: null, expires_at: "2026-11-01T00:00:00Z" },
      { code: "D", used_at: null, expires_at: "2026-12-02T00:00:00Z" },
    ];
    const groups = groupInvites(invites, now);
    expect(groups.unused.map((i) => i.code)).toEqual(["A", "D"]);
    expect(groups.used.map((i) => i.code)).toEqual(["B"]);
    expect(groups.expired.map((i) => i.code)).toEqual(["C"]);
  });
});
