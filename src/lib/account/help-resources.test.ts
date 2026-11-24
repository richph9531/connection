import { describe, expect, it } from "vitest";
import { CRISIS_RESOURCES, EMERGENCY_NUMBERS, smsHref, telHref } from "./help-resources";

describe("help resources", () => {
  it("builds dialable phone and text links", () => {
    expect(telHref("0800 567 567")).toBe("tel:0800567567");
    expect(telHref("+44 116 123")).toBe("tel:+44116123");
    expect(smsHref("988")).toBe("sms:988");
  });

  it("every resource has a way to reach it and only uses https links", () => {
    for (const resource of CRISIS_RESOURCES) {
      expect(resource.contacts.length).toBeGreaterThan(0);
      for (const contact of resource.contacts) {
        expect(contact.phone || contact.sms || contact.url).toBeTruthy();
        if (contact.url) expect(contact.url).toMatch(/^https:\/\//);
        if (contact.phone) expect(contact.phone).toMatch(/^\+?\d+$/);
      }
    }
  });

  it("lists emergency numbers", () => {
    expect(EMERGENCY_NUMBERS.length).toBeGreaterThan(0);
    for (const entry of EMERGENCY_NUMBERS) expect(entry.number).toMatch(/^\d+$/);
  });
});
