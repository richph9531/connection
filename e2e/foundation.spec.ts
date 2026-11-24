import { expect, test } from "@playwright/test";
import { joinAsNewMember, uniqueEmail } from "./helpers";

test("public pages are reachable and protected pages redirect to login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Connection" })).toBeVisible();
  await page.getByRole("link", { name: "Get help now" }).click();
  await expect(page.getByRole("heading", { name: "Get help now" })).toBeVisible();
  await page.goto("/feed");
  await expect(page).toHaveURL(/\/login$/);
});

test("an invalid invite code is rejected", async ({ page }) => {
  await page.goto("/login?mode=join");
  await page.getByLabel("Invite code").fill("NOT-A-REAL-CODE");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByRole("button", { name: "Join Connection" }).click();
  await expect(page.getByText("That invite code isn't valid")).toBeVisible();
});

test("a new member can join with an invite, onboard and log out", async ({ page }) => {
  const { displayName } = await joinAsNewMember(page);
  await expect(page.getByTestId("display-name")).toHaveText(displayName);
  await expect(page.getByRole("link", { name: "Moderation" })).toHaveCount(0);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:3000\/$/);
});
