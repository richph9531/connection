import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDays, partnerStreak } from "./streak";

describe("daysBetween", () => {
  it("counts whole calendar days, including across month and DST boundaries", () => {
    expect(daysBetween("2026-03-01", "2026-03-01")).toBe(0);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(daysBetween("2026-03-25", "2026-04-05")).toBe(11);
  });

  it("never goes negative", () => {
    expect(daysBetween("2026-03-05", "2026-03-01")).toBe(0);
  });
});

describe("addDays", () => {
  it("shifts dates forwards and backwards", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-24", -29)).toBe("2026-10-26");
  });
});

describe("partnerStreak", () => {
  it("counts days since the recovery start in the partner's today", () => {
    expect(partnerStreak("2026-11-14", 3, "2026-11-24")).toEqual({ current: 10, longest: 10 });
  });

  it("keeps a longer past streak", () => {
    expect(partnerStreak("2026-11-20", 40, "2026-11-24")).toEqual({ current: 4, longest: 40 });
  });

  it("handles a missing start date", () => {
    expect(partnerStreak(null, 0, "2026-11-24")).toEqual({ current: 0, longest: 0 });
  });
});

describe("formatDays", () => {
  it("uses encouraging, readable wording", () => {
    expect(formatDays(0)).toBe("Fresh start today");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(12)).toBe("12 days");
  });
});
