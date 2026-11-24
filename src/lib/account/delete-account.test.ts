import { describe, expect, it } from "vitest";
import { deleteAccountSchema, isDeleteConfirmed } from "./delete-account";

describe("delete account confirmation", () => {
  it("accepts DELETE in any case with surrounding spaces", () => {
    expect(isDeleteConfirmed("DELETE")).toBe(true);
    expect(isDeleteConfirmed(" delete ")).toBe(true);
  });

  it("rejects anything else with a gentle message", () => {
    expect(isDeleteConfirmed("")).toBe(false);
    expect(isDeleteConfirmed("DELET")).toBe(false);
    expect(isDeleteConfirmed("yes")).toBe(false);
    const parsed = deleteAccountSchema.safeParse({ confirmation: "no" });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Please type DELETE to confirm.");
  });
});
