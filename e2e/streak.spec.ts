import { expect, test } from "@playwright/test";
import { todayIn } from "../src/lib/dates";
import { addDays } from "../src/lib/streak/streak";
import { joinAsNewMember } from "./helpers";
import { addCheckIn, countMilestonePosts, joinWithStartDate } from "./streak-helpers";

const TIME_ZONE = "Africa/Johannesburg";

test.use({ viewport: { width: 375, height: 812 }, timezoneId: TIME_ZONE });

test("a member sees their streak, calendar and can share a milestone", async ({ page }, testInfo) => {
  const today = todayIn(TIME_ZONE);
  const displayName = await joinWithStartDate(page, addDays(today, -8), TIME_ZONE);
  const cleanDay = addDays(today, -1);
  const freshStartDay = addDays(today, -10);
  addCheckIn(displayName, cleanDay, true);
  addCheckIn(displayName, freshStartDay, false);

  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Your progress" })).toBeVisible();
  await expect(page.getByTestId("current-streak")).toHaveText("8 days");
  await expect(page.getByTestId("longest-streak")).toHaveText("8 days");
  await expect(page.getByText("6 days to your 14-day milestone.")).toBeVisible();
  await expect(page.locator('[data-milestone="7"]')).toHaveAttribute("data-reached", "true");
  await expect(page.locator('[data-milestone="14"]')).toHaveAttribute("data-reached", "false");
  await expect(page.getByRole("heading", { name: "You reached 7 days!" })).toBeVisible();

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(375);
  await page.screenshot({ path: testInfo.outputPath("streak-375.png"), fullPage: true });

  await page.goto(`/streak?month=${cleanDay.slice(0, 7)}`);
  await expect(page.locator(`[data-date="${cleanDay}"]`)).toHaveAttribute("data-status", "clean");
  await page.goto(`/streak?month=${freshStartDay.slice(0, 7)}`);
  await expect(page.locator(`[data-date="${freshStartDay}"]`)).toHaveAttribute("data-status", "fresh-start");

  await page.goto("/streak");
  await page.getByLabel("Your message").fill("Seven days today. Thank you all!");
  await page.getByRole("button", { name: "Share with the community" }).click();
  await expect(page.getByText("You shared this with the community.")).toBeVisible();
  expect(countMilestonePosts(displayName, 7)).toBe(1);

  await page.reload();
  await expect(page.getByText("You shared this with the community.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Share with the community" })).toHaveCount(0);
});

test("a member can say 'not now' to sharing a milestone", async ({ page }) => {
  const today = todayIn(TIME_ZONE);
  const displayName = await joinWithStartDate(page, addDays(today, -1), TIME_ZONE);
  await page.goto("/streak");
  await expect(page.getByTestId("current-streak")).toHaveText("1 day");
  await expect(page.getByRole("heading", { name: "You reached 1 day!" })).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByTestId("milestone-card")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("milestone-card")).toHaveCount(0);
  expect(countMilestonePosts(displayName, 1)).toBe(0);
});

test("a new member on day one gets an encouraging start", async ({ page }) => {
  await joinAsNewMember(page);
  await page.goto("/streak");
  await expect(page.getByTestId("current-streak")).toHaveText("0 days");
  await expect(page.getByText("Every day is a fresh start")).toBeVisible();
  await expect(page.getByTestId("milestone-card")).toHaveCount(0);
  await expect(page.getByText("1 day to your 1-day milestone.")).toBeVisible();
});
