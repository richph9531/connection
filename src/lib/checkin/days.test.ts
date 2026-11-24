import { describe, expect, it } from "vitest";
import { daysBetween, formatDay, isIsoDate, streakReset } from "./days";

describe("isIsoDate", () => {
  it("accepts real dates only", () => {
    expect(isIsoDate("2026-11-24")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("24-11-2026")).toBe(false);
    expect(isIsoDate("../etc")).toBe(false);
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days, across DST and month ends", () => {
    expect(daysBetween("2026-11-24", "2026-11-24")).toBe(0);
    expect(daysBetween("2026-03-28", "2026-04-02")).toBe(5);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(daysBetween("2026-01-10", "2026-01-01")).toBe(0);
  });
});

describe("formatDay", () => {
  it("formats without shifting the date", () => {
    expect(formatDay("2026-11-24")).toBe("Tuesday, 24 November 2026");
    expect(formatDay("2026-11-24", "short")).toBe("Tue 24 Nov");
  });
});

describe("streakReset", () => {
  it("restarts from today and keeps the longest streak", () => {
    expect(streakReset({ recovery_start_date: "2026-11-01", longest_streak: 5 }, "2026-11-24")).toEqual({
      recovery_start_date: "2026-11-24",
      longest_streak: 23,
    });
    expect(streakReset({ recovery_start_date: "2026-11-20", longest_streak: 40 }, "2026-11-24")).toEqual({
      recovery_start_date: "2026-11-24",
      longest_streak: 40,
    });
  });

  it("does nothing when the streak already starts today", () => {
    expect(streakReset({ recovery_start_date: "2026-11-24", longest_streak: 3 }, "2026-11-24")).toBeNull();
  });
});
