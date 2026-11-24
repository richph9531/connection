import { describe, expect, it } from "vitest";
import { isValidTimeZone, todayIn } from "./dates";

describe("todayIn", () => {
  const lateUtc = new Date("2026-03-01T23:30:00Z");

  it("uses the member's local date, not UTC", () => {
    expect(todayIn("UTC", lateUtc)).toBe("2026-03-01");
    expect(todayIn("Africa/Johannesburg", lateUtc)).toBe("2026-03-02");
    expect(todayIn("America/New_York", lateUtc)).toBe("2026-03-01");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones and rejects unknown ones", () => {
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
