import { describe, expect, it } from "vitest";
import { parseCheckInForm } from "./schema";

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const valid = { clean: "yes", mood: "4", urgeLevel: "3", triggers: ["stress", "boredom"], note: "  a good day  ", shareWithPartner: "on" };

describe("parseCheckInForm", () => {
  it("parses a complete check-in", () => {
    const { result } = parseCheckInForm(form(valid));
    expect(result.success && result.data).toEqual({
      clean: true,
      mood: 4,
      urgeLevel: 3,
      triggers: ["stress", "boredom"],
      note: "a good day",
      shareWithPartner: true,
    });
  });

  it("treats a missing share box as not shared and an empty note as no note", () => {
    const { clean, mood, urgeLevel } = valid;
    const { result } = parseCheckInForm(form({ clean, mood, urgeLevel, note: "   ", triggers: [] }));
    expect(result.success && result.data).toMatchObject({ clean: true, note: null, triggers: [], shareWithPartner: false });
  });

  it("asks gently for missing answers", () => {
    expect(parseCheckInForm(form({ ...valid, clean: "" })).result.error?.issues[0].message).toBe(
      "Please choose whether you stayed clean today.",
    );
    expect(parseCheckInForm(form({ ...valid, mood: "" })).result.error?.issues[0].message).toBe("Please choose a mood.");
    expect(parseCheckInForm(form({ ...valid, urgeLevel: "" })).result.success).toBe(false);
  });

  it("rejects out-of-range values and unknown triggers", () => {
    expect(parseCheckInForm(form({ ...valid, mood: "6" })).result.success).toBe(false);
    expect(parseCheckInForm(form({ ...valid, mood: "2.5" })).result.success).toBe(false);
    expect(parseCheckInForm(form({ ...valid, urgeLevel: "11" })).result.success).toBe(false);
    expect(parseCheckInForm(form({ ...valid, urgeLevel: "-1" })).result.success).toBe(false);
    expect(parseCheckInForm(form({ ...valid, triggers: ["gambling"] })).result.success).toBe(false);
    expect(parseCheckInForm(form({ ...valid, note: "x".repeat(5001) })).result.success).toBe(false);
  });

  it("removes duplicate triggers and keeps raw values for re-display", () => {
    const { values, result } = parseCheckInForm(form({ ...valid, triggers: ["stress", "stress"] }));
    expect(result.success && result.data.triggers).toEqual(["stress"]);
    expect(values.note).toBe("  a good day  ");
  });
});
