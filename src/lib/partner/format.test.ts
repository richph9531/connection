import { describe, expect, it } from "vitest";
import { cleanLabel, formatCheckInDate, formatTrigger, moodFor } from "./format";

describe("formatCheckInDate", () => {
  it("formats the stored date without shifting it by time zone", () => {
    expect(formatCheckInDate("2026-11-24")).toBe("Tue 24 Nov");
    expect(formatCheckInDate("2026-01-01")).toBe("Thu 1 Jan");
  });
});

describe("formatTrigger", () => {
  it("turns stored trigger values into labels", () => {
    expect(formatTrigger("stress")).toBe("Stress");
    expect(formatTrigger("late-night phone")).toBe("Late-night phone");
    expect(formatTrigger("late_night_phone")).toBe("Late night phone");
  });
});

describe("moodFor", () => {
  it("maps 1-5 to faces and falls back for unknown values", () => {
    expect(moodFor(5).label).toBe("Great");
    expect(moodFor(1).label).toBe("Very low");
    expect(moodFor(9).label).toBe("Okay");
  });
});

describe("cleanLabel", () => {
  it("never uses shaming words", () => {
    expect(cleanLabel(true)).toBe("Clean day");
    expect(cleanLabel(false)).toBe("Tough day");
    expect(cleanLabel(false)).not.toMatch(/fail|relapse|bad/i);
  });
});
