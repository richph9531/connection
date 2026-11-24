import { expect, test, type Page } from "@playwright/test";
import { deletePostsBy, insertPosts, newPhonePage, openReportCount, PHONE } from "./feed-helpers";
import { joinAsNewMember } from "./helpers";

test.use({ viewport: PHONE.viewport });

async function expectNoSideScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("members post, encourage, reply to and report each other on the community feed", async ({ browser, page }) => {
  const stamp = Date.now() % 1e6;
  const alice = await joinAsNewMember(page, `Alice ${stamp}`);
  const postText = `Day 14 and feeling stronger ${stamp}`;

  await page.getByRole("link", { name: "Community" }).click();
  await expect(page.getByRole("heading", { name: "Community" })).toBeVisible();
  await page.getByLabel("Share your progress").fill(postText);
  await expect(page.getByText(`${postText.length}/2000`)).toBeVisible();
  await page.getByRole("button", { name: "Post", exact: true }).click();

  const alicePost = page.getByTestId("post").filter({ hasText: postText });
  await expect(alicePost).toBeVisible();
  await expect(alicePost).toContainText(alice.displayName);
  await expect(alicePost).toContainText("Today at");
  await expect(page.getByLabel("Share your progress")).toHaveValue("");
  await expect(alicePost.getByRole("button", { name: "Report post" })).toHaveCount(0);
  await expectNoSideScroll(page);

  const bobPage = await newPhonePage(browser);
  const bob = await joinAsNewMember(bobPage, `Bob ${stamp}`);
  await bobPage.goto("/feed");
  const bobView = bobPage.getByTestId("post").filter({ hasText: postText });
  await expect(bobView).toBeVisible();
  await expect(bobView).not.toContainText("@example.com");

  const support = bobView.getByRole("button", { name: /^Support/ });
  await support.click();
  await expect(support).toHaveAttribute("aria-pressed", "true");
  await expect(support).toHaveAccessibleName("Support: 1");
  await bobView.getByRole("button", { name: /^Strength/ }).click();
  await expect(bobView.getByRole("button", { name: /^Strength/ })).toHaveAccessibleName("Strength: 1");

  await bobView.getByRole("button", { name: "Reply" }).click();
  await bobView.getByLabel("Write an encouraging reply").fill("So proud of you, keep going!");
  await bobView.getByRole("button", { name: "Send reply" }).click();
  await expect(bobView.getByRole("list", { name: "Replies" })).toContainText("So proud of you, keep going!");
  await expect(bobView.getByLabel("Write an encouraging reply")).toHaveValue("");

  await bobView.getByRole("button", { name: "Report post" }).click();
  await bobView.getByLabel("What's the concern?").fill("Just checking the report button works");
  await bobView.getByRole("button", { name: "Send report" }).click();
  await expect(bobView.getByRole("status")).toContainText("A moderator will take a look");
  expect(await openReportCount(postText)).toBe(1);
  await expectNoSideScroll(bobPage);

  await page.reload();
  await expect(alicePost.getByRole("button", { name: /^Support/ })).toHaveAccessibleName("Support: 1");
  await expect(alicePost.getByRole("button", { name: /^Support/ })).toHaveAttribute("aria-pressed", "false");
  await alicePost.getByRole("button", { name: "1 reply" }).click();
  await expect(alicePost.getByRole("list", { name: "Replies" })).toContainText(bob.displayName);
  await expect(alicePost.getByRole("list", { name: "Replies" })).not.toContainText(bob.email);

  await alicePost.getByRole("button", { name: "Delete post" }).click();
  await alicePost.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByTestId("post").filter({ hasText: postText })).toHaveCount(0);

  await bobPage.reload();
  await expect(bobPage.getByTestId("post").filter({ hasText: postText })).toHaveCount(0);
  await bobPage.context().close();
});

test("the feed is newest first and pages through older posts", async ({ page }) => {
  const stamp = Date.now() % 1e6;
  const { displayName } = await joinAsNewMember(page, `Pager ${stamp}`);
  const bodies = Array.from({ length: 11 }, (_, i) => `Paged post ${i + 1} (${stamp})`);
  await insertPosts(displayName, bodies);

  await page.goto("/feed");
  const posts = page.getByTestId("post");
  await expect(posts).toHaveCount(10);
  await expect(posts.first()).toContainText(`Paged post 11 (${stamp})`);
  await expect(page.getByText(`Paged post 1 (${stamp})`, { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Older posts" }).click();
  await expect(page).toHaveURL(/\/feed\?page=2$/);
  await expect(page.getByText(`Paged post 1 (${stamp})`, { exact: true })).toBeVisible();
  await expect(page.getByLabel("Share your progress")).toHaveCount(0);
  await page.getByRole("link", { name: "Newer posts" }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await deletePostsBy(displayName);
});
