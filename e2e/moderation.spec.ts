import { expect, test } from "@playwright/test";
import { joinAsNewMember } from "./helpers";
import { createReportedPost, deletePost, joinWithInvite, setRole } from "./moderation-helpers";

test.use({ viewport: { width: 375, height: 812 } });

test("members cannot open the moderation page", async ({ page }) => {
  await joinAsNewMember(page);
  await expect(page.getByRole("link", { name: "Moderation" })).toHaveCount(0);
  const response = await page.goto("/moderation");
  expect(response?.status()).toBe(404);
});

test("an admin reviews a report, manages invites and changes a member's role", async ({ browser, page }) => {
  const suffix = Date.now() % 1e6;
  const authorPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const { displayName: author } = await joinAsNewMember(authorPage, `Author ${suffix}`);
  const { displayName: admin } = await joinAsNewMember(page, `Admin ${suffix}`);
  setRole(admin, "admin");
  const body = `Reported post ${suffix}`;
  createReportedPost(author, admin, body, "This felt unkind");

  // Reports: remove, then restore from the removed list.
  await page.goto("/moderation");
  await expect(page.getByRole("heading", { name: "Moderation" })).toBeVisible();
  const report = page.getByTestId("report").filter({ hasText: body });
  await expect(report).toContainText(`Post by ${author}`);
  await expect(report).toContainText("This felt unkind");
  await page.screenshot({ path: "test-results/moderation-375.png", fullPage: true });
  await report.getByRole("button", { name: "Remove post" }).click();
  await expect(page.getByTestId("report").filter({ hasText: body })).toHaveCount(0);
  const removed = page.getByTestId("removed-item").filter({ hasText: body });
  await expect(removed).toBeVisible();
  await removed.getByRole("button", { name: /Restore/ }).click();
  await expect(page.getByTestId("removed-item").filter({ hasText: body })).toHaveCount(0);

  // Invites: create one, see it unused, then someone joins with it.
  await page.getByRole("link", { name: "Invites" }).click();
  await page.getByLabel("Invite lasts for").selectOption("7");
  await page.getByRole("button", { name: "Create invite" }).click();
  const code = (await page.getByTestId("new-invite-code").textContent())!.trim();
  expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  await expect(page.getByTestId("invites-unused")).toContainText(code);

  const invitedPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const invited = `Invited ${suffix}`;
  await joinWithInvite(invitedPage, code, invited);
  await invitedPage.close();
  await page.reload();
  await expect(page.getByTestId("invites-used")).toContainText(code);
  await expect(page.getByTestId("invites-used")).toContainText(`Used by ${invited}`);

  // Members: promote the author to moderator.
  await page.getByRole("link", { name: "Members" }).click();
  await expect(page.getByTestId("member-row").filter({ hasText: admin })).toContainText("Admin (you)");
  const row = page.getByTestId("member-row").filter({ hasText: author });
  await row.getByRole("combobox", { name: `Role for ${author}` }).selectOption("moderator");
  await row.getByRole("button", { name: `Save role for ${author}` }).click();
  await expect(row.getByRole("status")).toHaveText("Role updated.");

  await authorPage.reload();
  await authorPage.getByRole("link", { name: "Moderation" }).click();
  await expect(authorPage.getByRole("heading", { name: "Reports to review" })).toBeVisible();
  await expect(authorPage.getByRole("link", { name: "Invites" })).toBeVisible();
  await expect(authorPage.getByRole("link", { name: "Members" })).toHaveCount(0);
  await authorPage.close();
});

test("a report stays open after the author deletes the post", async ({ browser, page }) => {
  const suffix = Date.now() % 1e6;
  const authorPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const { displayName: author } = await joinAsNewMember(authorPage, `Deleter ${suffix}`);
  await authorPage.close();
  const { displayName: mod } = await joinAsNewMember(page, `Mod ${suffix}`);
  setRole(mod, "moderator");
  const reason = `Hurtful ${suffix}`;
  createReportedPost(author, mod, `Soon deleted ${suffix}`, reason);
  deletePost(`Soon deleted ${suffix}`);

  await page.goto("/moderation");
  const report = page.getByTestId("report").filter({ hasText: reason });
  await expect(report).toContainText(`Post by ${author}`);
  await expect(report).toContainText("Deleted by author");
  await expect(report).toContainText("The author deleted this after it was reported.");
  await report.getByRole("button", { name: "Close report" }).click();
  await expect(page.getByTestId("report").filter({ hasText: reason })).toHaveCount(0);
});
