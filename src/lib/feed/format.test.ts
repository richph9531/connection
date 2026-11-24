import { describe, expect, it } from "vitest";
import { formatPostTime, milestoneLabel } from "./format";

const now = new Date("2026-11-24T20:30:00Z");

describe("formatPostTime", () => {
  it("uses the viewer's time zone to decide today and yesterday", () => {
    expect(formatPostTime("2026-11-24T08:05:00Z", "UTC", now)).toBe("Today at 08:05");
    expect(formatPostTime("2026-11-24T08:05:00Z", "Africa/Johannesburg", now)).toBe("Today at 10:05");
    // 23:00 UTC on the 23rd is already the 24th in Johannesburg.
    expect(formatPostTime("2026-11-23T23:00:00Z", "UTC", now)).toBe("Yesterday at 23:00");
    expect(formatPostTime("2026-11-23T23:00:00Z", "Africa/Johannesburg", now)).toBe("Today at 01:00");
    // 20:30 UTC on the 24th is already the 25th in Auckland.
    expect(formatPostTime("2026-11-24T08:05:00Z", "Pacific/Auckland", now)).toBe("Yesterday at 21:05");
  });

  it("shows a short date for older posts and adds the year when it differs", () => {
    expect(formatPostTime("2026-11-03T12:00:00Z", "UTC", now)).toBe("3 Nov");
    expect(formatPostTime("2025-12-31T12:00:00Z", "UTC", now)).toBe("31 Dec 2025");
  });

  it("returns an empty label instead of crashing on timestamps JavaScript can't represent", () => {
    expect(formatPostTime("infinity", "UTC", now)).toBe("");
    expect(formatPostTime("294276-01-01T00:00:00+00:00", "UTC", now)).toBe("");
  });

  it("handles yesterday across a month boundary", () => {
    expect(formatPostTime("2026-11-30T10:00:00Z", "UTC", new Date("2026-12-01T09:00:00Z"))).toBe("Yesterday at 10:00");
  });
});

describe("milestoneLabel", () => {
  it("reads naturally for one and many days", () => {
    expect(milestoneLabel(1)).toBe("1 day milestone");
    expect(milestoneLabel(30)).toBe("30 day milestone");
  });
});
