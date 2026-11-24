import { describe, expect, it } from "vitest";
import { displayNameSchema, loginSchema, onboardingSchema } from "./validation";

describe("loginSchema", () => {
  it("normalises email and invite code", () => {
    const result = loginSchema.parse({ mode: "join", email: " Me@Example.com ", inviteCode: " abc-123 " });
    expect(result).toEqual({ mode: "join", email: "me@example.com", inviteCode: "ABC-123" });
  });

  it("requires an invite code to join", () => {
    expect(loginSchema.safeParse({ mode: "join", email: "a@b.co" }).success).toBe(false);
  });

  it("rejects invalid emails", () => {
    expect(loginSchema.safeParse({ mode: "login", email: "nope" }).success).toBe(false);
  });
});

describe("displayNameSchema", () => {
  it.each(["Hopeful Hiker", "day_one", "J.R-2"])("accepts %s", (name) => {
    expect(displayNameSchema.safeParse(name).success).toBe(true);
  });

  it.each(["ab", "x".repeat(31), "<script>"])("rejects %s", (name) => {
    expect(displayNameSchema.safeParse(name).success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("rejects future recovery dates", () => {
    const result = onboardingSchema.safeParse({
      displayName: "Steady",
      recoveryStartDate: "2999-01-01",
      timezone: "UTC",
    });
    expect(result.success).toBe(false);
  });
});
