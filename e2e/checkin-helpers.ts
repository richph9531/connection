import { expect, type Page } from "@playwright/test";
import { startJoining } from "./helpers";

/** Joins and onboards with a recovery start date `daysAgo` days in the past. */
export async function joinWithRecoveryStart(page: Page, daysAgo: number) {
  await startJoining(page);
  const start = new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Display name").fill(`Checkin ${Date.now() % 1e6}`);
  await page.getByLabel("When did your current recovery start?").fill(start);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/checkin/);
}
