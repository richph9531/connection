import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { countMemberRows, seedMemberContent, userIdFor } from "./account-helpers";
import { joinAsNewMember } from "./helpers";

test.use({ viewport: { width: 375, height: 812 } });

test("help and privacy pages are public and linked from the footer", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
  await expect(page.getByText("No ads, no third-party analytics and no trackers.")).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "Get help now" }).click();
  await expect(page.getByRole("heading", { name: "Get help now" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "If you are in danger right now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Call 988" }).first()).toHaveAttribute("href", "tel:988");
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalScroll).toBe(false);
});

test("a member can download their data and then delete their account", async ({ browser, page }) => {
  const other = await browser.newPage();
  const { email: otherEmail } = await joinAsNewMember(other);
  seedMemberContent(userIdFor(otherEmail), "someone else's note");
  await other.close();

  const { email, displayName } = await joinAsNewMember(page);
  const userId = userIdFor(email);
  seedMemberContent(userId, "my private note");

  await page.getByRole("link", { name: "Account" }).click();
  await expect(page.getByRole("heading", { name: "Your account", exact: true })).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^connection-export-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.profile.display_name).toBe(displayName);
  expect(exported.account.email).toBe(email);
  expect(exported.check_ins).toHaveLength(1);
  expect(exported.check_ins[0].note).toBe("my private note");
  expect(exported.posts.map((p: { body: string }) => p.body)).toEqual(["Grateful for this group"]);
  expect(exported.comments).toHaveLength(1);
  expect(JSON.stringify(exported)).not.toContain("someone else's note");

  await page.getByRole("button", { name: "Delete my account…" }).click();
  const confirm = page.getByRole("button", { name: "Permanently delete my account" });
  await expect(confirm).toBeDisabled();
  await page.getByRole("button", { name: "Keep my account" }).click();
  await expect(confirm).toHaveCount(0);

  await page.getByRole("button", { name: "Delete my account…" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await confirm.click();
  await expect(page).toHaveURL(/\/help\?deleted=1/);
  await expect(page.getByRole("status")).toContainText("Your account has been deleted");
  expect(countMemberRows(userId)).toBe(0);

  await page.goto("/account");
  await expect(page).toHaveURL(/\/login$/);
});

test("the export link needs a signed-in member", async ({ request }) => {
  const response = await request.get("/account/export", { maxRedirects: 0 });
  expect([302, 307, 401]).toContain(response.status());
});
