import { describe, expect, it } from "vitest";
import { moodFor, triggerLabel } from "./options";
import { pageFromParam, rowToFormValues } from "./rows";

describe("rowToFormValues", () => {
  it("maps a saved check-in back to form values", () => {
    expect(
      rowToFormValues({ clean: false, mood: 2, urge_level: 7, triggers: ["conflict"], note: null, share_with_partner: false }),
    ).toEqual({ clean: "no", mood: "2", urgeLevel: "7", triggers: ["conflict"], note: "", shareWithPartner: false });
  });
});

describe("pageFromParam", () => {
  it("falls back to the first page for anything invalid", () => {
    expect(pageFromParam("3")).toBe(3);
    expect(pageFromParam(["2", "5"])).toBe(2);
    expect(pageFromParam(undefined)).toBe(1);
    expect(pageFromParam("0")).toBe(1);
    expect(pageFromParam("abc")).toBe(1);
    expect(pageFromParam("1.5")).toBe(1);
  });
});

describe("options", () => {
  it("labels moods and triggers", () => {
    expect(moodFor(5)?.label).toBe("Great");
    expect(moodFor(9)).toBeUndefined();
    expect(triggerLabel("late_night_phone")).toBe("Late-night phone");
  });
});
