import { readFile } from "node:fs/promises";
import { devices, expect, test } from "@playwright/test";
import { joinAsNewMember } from "./helpers";

const PHONE = { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } };
test.use({ viewport: PHONE.viewport });

// The whole member journey through the UI: join, check in, see progress, post,
// get encouragement, partner up, export, and leave without a trace.
test("two members use every part of Connection together", async ({ browser, page }) => {
  const stamp = Date.now() % 1e6;
  const ann = await joinAsNewMember(page, `Ann ${stamp}`);
  const benContext = await browser.newContext(PHONE);
  const benPage = await benContext.newPage();
  const ben = await joinAsNewMember(benPage, `Ben ${stamp}`);

  // Ann checks in and shares it with her future partner.
  await page.getByText("Yes", { exact: true }).click();
  await page.getByLabel("Good").check({ force: true });
  await page.getByLabel("Urge level").fill("2");
  await page.getByLabel("Private journal note (optional)").fill(`ann secret ${stamp}`);
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("status")).toContainText("Check-in saved");

  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Your progress" })).toBeVisible();
  await expect(page.locator('[data-status="clean"]')).not.toHaveCount(0);

  // Ann posts; Ben encourages and replies.
  const postText = `First week done ${stamp}`;
  await page.getByRole("link", { name: "Community" }).click();
  await page.getByLabel("Share your progress").fill(postText);
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByTestId("post").filter({ hasText: postText })).toBeVisible();

  await benPage.goto("/feed");
  const benView = benPage.getByTestId("post").filter({ hasText: postText });
  await benView.getByRole("button", { name: /^Support/ }).click();
  await expect(benView.getByRole("button", { name: /^Support/ })).toHaveAccessibleName("Support: 1");
  await benView.getByRole("button", { name: "Reply" }).click();
  await benView.getByLabel("Write an encouraging reply").fill("Proud of you!");
  await benView.getByRole("button", { name: "Send reply" }).click();
  await expect(benView.getByRole("list", { name: "Replies" })).toContainText("Proud of you!");
  await expect(benView).not.toContainText(ann.email);

  // Ben asks Ann to be partners; Ann accepts; Ben sees her shared check-in but not her note.
  await benPage.goto("/partner");
  await benPage.getByLabel("Partner's display name").fill(ann.displayName);
  await benPage.getByRole("button", { name: "Send request" }).click();
  await expect(benPage.getByRole("status")).toContainText(`Request sent to ${ann.displayName}`);
  await page.getByRole("link", { name: "Partner" }).click();
  await page.getByRole("button", { name: `Accept ${ben.displayName}` }).click();
  await expect(page.getByTestId("partner-card")).toContainText(ben.displayName);
  await benPage.reload();
  const card = benPage.getByTestId("partner-card");
  await expect(card.getByTestId("shared-check-in")).toContainText("Clean day");
  await expect(benPage.getByText(`ann secret ${stamp}`)).toHaveCount(0);

  // Ann downloads her data, then deletes her account.
  await page.getByRole("link", { name: "Account" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const exported = JSON.parse(await readFile((await (await downloadPromise).path())!, "utf8"));
  expect(exported.check_ins.map((c: { note: string }) => c.note)).toContain(`ann secret ${stamp}`);
  expect(exported.posts.map((p: { body: string }) => p.body)).toContain(postText);

  await page.getByRole("button", { name: "Delete my account…" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Permanently delete my account" }).click();
  await expect(page).toHaveURL(/\/help\?deleted=1/);

  // Nothing of Ann's is left for Ben to see.
  await benPage.goto("/feed");
  await expect(benPage.getByTestId("post").filter({ hasText: postText })).toHaveCount(0);
  await benPage.goto("/partner");
  await expect(benPage.getByTestId("partner-card")).toHaveCount(0);
  await expect(benPage.getByText(ann.displayName)).toHaveCount(0);
  await benContext.close();
});
