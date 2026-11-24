import { expect, test } from "@playwright/test";
import { joinWithRecoveryStart } from "./checkin-helpers";
import { joinAsNewMember } from "./helpers";

test.use({ viewport: { width: 375, height: 812 } });

test("a member checks in, edits it, sees history and can start a fresh streak", async ({ page }) => {
  await joinWithRecoveryStart(page, 20);
  await expect(page.getByRole("heading", { name: "Daily check-in" })).toBeVisible();

  await page.getByText("Yes", { exact: true }).click();
  await page.getByLabel("Good").check({ force: true });
  await page.getByLabel("Urge level").fill("3");
  await page.getByText("Stress", { exact: true }).click();
  await page.getByText("Late-night phone", { exact: true }).click();
  await page.getByLabel("Private journal note (optional)").fill("Went for a walk instead.");
  await expect(page.getByLabel("Share this check-in with my accountability partner")).toBeChecked();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: "test-results/checkin-375.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("status")).toContainText("Check-in saved");
  await expect(page.getByRole("button", { name: "Update check-in" })).toBeVisible();

  // The saved values come back after a reload, ready to edit.
  await page.reload();
  await expect(page.getByLabel("Urge level")).toHaveValue("3");
  await expect(page.getByLabel("Good")).toBeChecked();
  await expect(page.getByLabel("Private journal note (optional)")).toHaveValue("Went for a walk instead.");

  // Edit today's check-in: a hard day gets a compassionate message and a fresh-start offer.
  await page.getByText("No", { exact: true }).click();
  await page.getByLabel("Share this check-in with my accountability partner").uncheck();
  await page.getByRole("button", { name: "Update check-in" }).click();
  const support = page.getByTestId("relapse-support");
  await expect(support).toContainText("Every day is a fresh start");
  await support.getByRole("button", { name: "Start a fresh streak from today" }).click();
  await expect(support.getByRole("status")).toContainText("Your new streak starts today");

  // History list and the per-day detail view.
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading", { name: "Check-in history" })).toBeVisible();
  const entries = page.getByRole("list", { name: "Your check-ins" }).getByRole("link");
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toContainText("Hard day");
  await entries.first().click();
  await expect(page.getByTestId("journal-note")).toHaveText("Went for a walk instead.");
  await expect(page.getByText("Late-night phone")).toBeVisible();
  await expect(page.getByText("Shared with partner")).toBeVisible();
  await page.getByRole("link", { name: "Edit today's check-in" }).click();
  await expect(page).toHaveURL(/\/checkin$/);
});

test("check-in pages for other days are not found", async ({ page }) => {
  await joinAsNewMember(page);
  const missing = await page.goto("/checkin/2001-01-01");
  expect(missing?.status()).toBe(404);
  const invalid = await page.goto("/checkin/not-a-date");
  expect(invalid?.status()).toBe(404);
});
