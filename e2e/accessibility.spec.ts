import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { joinAsNewMember } from "./helpers";
import { setRole } from "./moderation-helpers";

test.use({ viewport: { width: 375, height: 812 } });

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectAccessible(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary, `${path} has accessibility problems`).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${path} scrolls sideways at 375px`).toBeLessThanOrEqual(0);
}

test("public pages meet WCAG 2.1 AA at 375px", async ({ page }) => {
  for (const path of ["/", "/login", "/login?mode=join", "/help", "/privacy"]) {
    await expectAccessible(page, path);
  }
});

test("member pages meet WCAG 2.1 AA at 375px", async ({ page }) => {
  const { displayName } = await joinAsNewMember(page, `Axe ${Date.now() % 1e6}`);
  setRole(displayName, "admin");
  for (const path of [
    "/checkin",
    "/checkin/history",
    "/streak",
    "/feed",
    "/partner",
    "/account",
    "/moderation",
    "/moderation?tab=invites",
    "/moderation?tab=members",
  ]) {
    await expectAccessible(page, path);
  }
});
