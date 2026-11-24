import { describe, expect, it } from "vitest";
import { isPublicPath, navItemsFor } from "./routes";

describe("isPublicPath", () => {
  it("allows public pages and auth routes", () => {
    for (const path of ["/", "/login", "/help", "/privacy", "/auth/callback"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("protects member pages", () => {
    for (const path of ["/checkin", "/feed", "/moderation", "/onboarding"]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});

describe("navItemsFor", () => {
  it("hides moderation from members", () => {
    expect(navItemsFor("member").map((i) => i.href)).not.toContain("/moderation");
    expect(navItemsFor("moderator").map((i) => i.href)).toContain("/moderation");
  });
});
