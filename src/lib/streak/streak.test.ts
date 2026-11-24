import { describe, expect, it } from "vitest";
import {
  addDays,
  currentStreakDays,
  dayStatus,
  daysBetween,
  formatDays,
  isDate,
  isMilestone,
  latestMilestone,
  longestStreakDays,
  monthBounds,
  monthGrid,
  nextMilestone,
  nextMilestoneMessage,
  progressToNext,
  reachedMilestones,
  resolveMonth,
  sharedInCurrentStreak,
  shiftMonth,
  streakMessage,
} from "./streak";

describe("dates", () => {
  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts whole days between dates, ignoring daylight saving", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
    expect(daysBetween("2026-01-02", "2026-01-01")).toBe(-1);
  });

  it("validates dates", () => {
    expect(isDate("2026-02-28")).toBe(true);
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("26-02-01")).toBe(false);
  });
});

describe("streaks", () => {
  it("counts days since the recovery start date", () => {
    expect(currentStreakDays("2026-11-24", "2026-11-24")).toBe(0);
    expect(currentStreakDays("2026-11-17", "2026-11-24")).toBe(7);
  });

  it("never goes negative when the start date is in the future", () => {
    expect(currentStreakDays("2026-11-25", "2026-11-24")).toBe(0);
  });

  it("keeps the longest streak", () => {
    expect(longestStreakDays(10, 3)).toBe(10);
    expect(longestStreakDays(10, 12)).toBe(12);
  });

  it("formats days", () => {
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(0)).toBe("0 days");
    expect(formatDays(14)).toBe("14 days");
  });

  it("uses encouraging wording at every stage", () => {
    for (const days of [0, 1, 7, 30, 365, 1000]) {
      expect(streakMessage(days)).not.toMatch(/fail|lost|broke|shame|bad/i);
    }
    expect(streakMessage(0)).toContain("fresh start");
  });
});

describe("milestones", () => {
  it("knows the milestone days", () => {
    expect([1, 7, 14, 30, 60, 90, 180, 365].every(isMilestone)).toBe(true);
    expect(isMilestone(2)).toBe(false);
  });

  it("finds reached, latest and next milestones", () => {
    expect(reachedMilestones(0)).toEqual([]);
    expect(reachedMilestones(15)).toEqual([1, 7, 14]);
    expect(latestMilestone(0)).toBeNull();
    expect(latestMilestone(7)).toBe(7);
    expect(latestMilestone(400)).toBe(365);
    expect(nextMilestone(0)).toEqual({ days: 1, remaining: 1 });
    expect(nextMilestone(8)).toEqual({ days: 14, remaining: 6 });
    expect(nextMilestone(365)).toBeNull();
  });

  it("measures progress from the previous milestone", () => {
    expect(progressToNext(0)).toBe(0);
    expect(progressToNext(7)).toBe(0);
    expect(progressToNext(22)).toBe(50);
    expect(progressToNext(500)).toBe(100);
  });

  it("describes the next milestone", () => {
    expect(nextMilestoneMessage(5)).toBe("2 days to your 7-day milestone.");
    expect(nextMilestoneMessage(0)).toBe("1 day to your 1-day milestone.");
    expect(nextMilestoneMessage(365)).toMatch(/every milestone/);
  });

  it("detects a share during the current streak in the member's time zone", () => {
    // 23:30 UTC on 16 Nov is already 17 Nov in Johannesburg.
    expect(sharedInCurrentStreak(["2026-11-16T23:30:00Z"], "2026-11-17", "Africa/Johannesburg")).toBe(true);
    expect(sharedInCurrentStreak(["2026-11-16T23:30:00Z"], "2026-11-17", "UTC")).toBe(false);
    expect(sharedInCurrentStreak([], "2026-11-17", "UTC")).toBe(false);
  });
});

describe("calendar", () => {
  const results = new Map([
    ["2026-11-02", true],
    ["2026-11-03", false],
  ]);

  it("colors days by check-in result", () => {
    expect(dayStatus("2026-11-02", "2026-11-24", results)).toBe("clean");
    expect(dayStatus("2026-11-03", "2026-11-24", results)).toBe("fresh-start");
    expect(dayStatus("2026-11-04", "2026-11-24", results)).toBe("none");
    expect(dayStatus("2026-11-25", "2026-11-24", results)).toBe("future");
  });

  it("builds a Monday-first month grid", () => {
    const grid = monthGrid("2026-11");
    // 1 November 2026 is a Sunday.
    expect(grid[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(grid.flat().filter(Boolean)).toHaveLength(30);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(monthGrid("2027-02").flat().filter(Boolean)).toHaveLength(28);
  });

  it("moves between months", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthBounds("2028-02")).toEqual({ first: "2028-02-01", last: "2028-02-29" });
  });

  it("only shows valid, non-future months", () => {
    expect(resolveMonth(undefined, "2026-11-24")).toBe("2026-11");
    expect(resolveMonth("2026-09", "2026-11-24")).toBe("2026-09");
    expect(resolveMonth("2026-12", "2026-11-24")).toBe("2026-11");
    expect(resolveMonth("2026-13", "2026-11-24")).toBe("2026-11");
    expect(resolveMonth("nonsense", "2026-11-24")).toBe("2026-11");
  });
});
