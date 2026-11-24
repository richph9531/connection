import { describe, expect, it } from "vitest";
import { dismissKey, milestoneToOffer } from "./milestone-offer";

const base = { userId: "member-a", recoveryStartDate: "2026-11-01", timeZone: "UTC", sharedPostTimes: [], dismissed: undefined };

describe("milestoneToOffer", () => {
  it("offers nothing before the first milestone", () => {
    expect(milestoneToOffer({ ...base, streak: 0 })).toBeNull();
  });

  it("offers the latest reached milestone", () => {
    expect(milestoneToOffer({ ...base, streak: 1 })).toEqual({ days: 1, shared: false });
    expect(milestoneToOffer({ ...base, streak: 9 })).toEqual({ days: 7, shared: false });
  });

  it("marks a milestone already shared in this streak", () => {
    expect(milestoneToOffer({ ...base, streak: 9, sharedPostTimes: ["2026-11-08T10:00:00Z"] })).toEqual({
      days: 7,
      shared: true,
    });
  });

  it("offers again after a fresh start even if shared in an earlier streak", () => {
    expect(milestoneToOffer({ ...base, streak: 9, sharedPostTimes: ["2026-10-01T10:00:00Z"] })).toEqual({
      days: 7,
      shared: false,
    });
  });

  it("respects 'not now' for that milestone only", () => {
    const dismissed = dismissKey("member-a", "2026-11-01", 7);
    expect(milestoneToOffer({ ...base, streak: 9, dismissed })).toBeNull();
    expect(milestoneToOffer({ ...base, streak: 14, dismissed })).toEqual({ days: 14, shared: false });
    expect(milestoneToOffer({ ...base, recoveryStartDate: "2026-11-02", streak: 8, dismissed })).toEqual({
      days: 7,
      shared: false,
    });
    expect(milestoneToOffer({ ...base, userId: "member-b", streak: 9, dismissed })).toEqual({ days: 7, shared: false });
  });
});
