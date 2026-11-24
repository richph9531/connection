import { describe, expect, it } from "vitest";
import { canChangeRole, isModerator, resolveTab, tabsFor } from "./roles";

describe("isModerator", () => {
  it("includes moderators and admins only", () => {
    expect(isModerator("member")).toBe(false);
    expect(isModerator("moderator")).toBe(true);
    expect(isModerator("admin")).toBe(true);
  });
});

describe("tabsFor / resolveTab", () => {
  it("shows the members tab to admins only", () => {
    expect(tabsFor("moderator")).toEqual(["reports", "invites"]);
    expect(tabsFor("admin")).toEqual(["reports", "invites", "members"]);
  });

  it("falls back to reports for unknown or forbidden tabs", () => {
    expect(resolveTab(undefined, "admin")).toBe("reports");
    expect(resolveTab("nope", "admin")).toBe("reports");
    expect(resolveTab("members", "moderator")).toBe("reports");
    expect(resolveTab("members", "admin")).toBe("members");
    expect(resolveTab("invites", "moderator")).toBe("invites");
    expect(resolveTab(["invites"], "moderator")).toBe("reports");
  });
});

describe("canChangeRole", () => {
  it("lets admins change other members' roles but not their own", () => {
    expect(canChangeRole({ id: "a", role: "admin" }, "b")).toBe(true);
    expect(canChangeRole({ id: "a", role: "admin" }, "a")).toBe(false);
    expect(canChangeRole({ id: "a", role: "moderator" }, "b")).toBe(false);
    expect(canChangeRole({ id: "a", role: "member" }, "b")).toBe(false);
  });
});
