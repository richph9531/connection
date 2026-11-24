import { devices, expect, test, type Browser } from "@playwright/test";
import { joinAsNewMember } from "./helpers";
import { addCheckIn, setStreakDays } from "./partner-helpers";

const PHONE = { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } };

test.use({ viewport: PHONE.viewport });

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now() % 1e6}${Math.floor(Math.random() * 100)}`;
}

async function newMember(browser: Browser, prefix: string) {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  const { displayName } = await joinAsNewMember(page, uniqueName(prefix));
  return { context, page, displayName };
}

test("members can partner up, see shared check-ins and end the partnership", async ({ page }, testInfo) => {
  const ann = { page, displayName: (await joinAsNewMember(page, uniqueName("Ann"))).displayName };
  const ben = await newMember(page.context().browser()!, "Ben");

  setStreakDays(ben.displayName, 12);
  addCheckIn(ben.displayName, {
    daysAgo: 0,
    clean: true,
    mood: 4,
    urge: 3,
    triggers: ["stress", "late-night phone"],
    note: "ben private journal note",
    share: true,
  });
  addCheckIn(ben.displayName, {
    daysAgo: 1,
    clean: false,
    mood: 2,
    urge: 9,
    triggers: ["boredom"],
    note: "ben unshared day",
    share: false,
  });

  // Ann asks Ben by display name.
  await ann.page.getByRole("link", { name: "Partner" }).click();
  await expect(ann.page.getByRole("heading", { name: "Accountability partner" })).toBeVisible();
  await ann.page.getByLabel("Partner's display name").fill(ben.displayName.toLowerCase());
  await ann.page.getByRole("button", { name: "Send request" }).click();
  await expect(ann.page.getByRole("status")).toContainText(`Request sent to ${ben.displayName}`);
  await expect(ann.page.getByTestId("outgoing-request")).toContainText(`Waiting for ${ben.displayName}`);

  await ann.page.getByLabel("Partner's display name").fill(ben.displayName);
  await ann.page.getByRole("button", { name: "Send request" }).click();
  await expect(ann.page.getByRole("alert").filter({ hasText: "already sent them a request" })).toBeVisible();

  // Ben accepts.
  await ben.page.goto("/partner");
  await expect(ben.page.getByTestId("incoming-request")).toContainText(`${ann.displayName} would like to be your`);
  await ben.page.getByRole("button", { name: `Accept ${ann.displayName}` }).click();
  await expect(ben.page.getByTestId("partner-card")).toContainText(ann.displayName);
  await expect(ben.page.getByTestId("partner-card")).toContainText("No shared check-ins");

  // Ann sees Ben's streak and shared check-in, but never the note or unshared days.
  await ann.page.reload();
  const card = ann.page.getByTestId("partner-card");
  await expect(card.getByRole("heading", { name: ben.displayName })).toBeVisible();
  await expect(card.getByTestId("partner-streak")).toHaveText("12 days");
  await expect(card.getByTestId("shared-check-in")).toHaveCount(1);
  await expect(card.getByTestId("shared-check-in")).toContainText("Today");
  await expect(card.getByTestId("shared-check-in")).toContainText("Clean day");
  await expect(card.getByTestId("shared-check-in")).toContainText("Good");
  await expect(card.getByTestId("shared-check-in")).toContainText("Urge: 3/10");
  await expect(card.getByTestId("shared-check-in")).toContainText("Late-night phone");
  await expect(ann.page.getByText("ben private journal note")).toHaveCount(0);
  await expect(ann.page.getByText("ben unshared day")).toHaveCount(0);
  await expect(ann.page.getByText("Tough day")).toHaveCount(0);

  const width = await ann.page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
  await ann.page.screenshot({ path: testInfo.outputPath("partner-375.png"), fullPage: true });

  // Ann ends the partnership after confirming.
  await card.getByRole("button", { name: "End partnership" }).click();
  await ann.page.getByRole("button", { name: "Keep partnership" }).click();
  await card.getByRole("button", { name: "End partnership" }).click();
  await ann.page.getByRole("button", { name: "Yes, end it" }).click();
  await expect(ann.page.getByTestId("partner-card")).toHaveCount(0);
  await expect(ann.page.getByRole("heading", { name: "Find a partner" })).toBeVisible();

  await ben.page.reload();
  await expect(ben.page.getByTestId("partner-card")).toHaveCount(0);
  await ben.context.close();
});

test("a member can decline a request and requests to unknown names are explained", async ({ page }) => {
  const { displayName: annName } = await joinAsNewMember(page, uniqueName("Ann"));
  const cal = await newMember(page.context().browser()!, "Cal");

  await page.goto("/partner");
  await page.getByLabel("Partner's display name").fill("No Such Member 999");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "couldn't find a member" })).toBeVisible();

  await page.getByLabel("Partner's display name").fill(annName);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "your own display name" })).toBeVisible();

  await page.getByLabel("Partner's display name").fill(cal.displayName);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("outgoing-request")).toBeVisible();

  await cal.page.goto("/partner");
  await cal.page.getByRole("button", { name: `Decline ${annName}` }).click();
  await expect(cal.page.getByTestId("incoming-request")).toHaveCount(0);
  await expect(cal.page.getByTestId("partner-card")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("outgoing-request")).toHaveCount(0);
  await expect(page.getByTestId("partner-card")).toHaveCount(0);
  await cal.context.close();
});
