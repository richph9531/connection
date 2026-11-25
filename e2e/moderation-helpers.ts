import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";
import { getMagicLink, uniqueEmail } from "./helpers";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** Runs SQL against the local database; values are passed as psql variables, never spliced into the SQL. */
function sql(query: string, vars: Record<string, string> = {}): string {
  const args = [DB_URL, "-qtA", "-v", "ON_ERROR_STOP=1"];
  for (const [name, value] of Object.entries(vars)) args.push("-v", `${name}=${value}`);
  return execFileSync("psql", args, { input: query }).toString().trim();
}

export function setRole(displayName: string, role: "member" | "moderator" | "admin") {
  sql("update public.profiles set role = :'role' where display_name = :'name';", { name: displayName, role });
}

/** A post by `author` that `reporter` has reported. Returns nothing; the body identifies it. */
export function createReportedPost(author: string, reporter: string, body: string, reason: string) {
  sql(
    `with post as (
       insert into public.posts (author_id, body)
       select id, :'body' from public.profiles where display_name = :'author'
       returning id
     )
     insert into public.reports (post_id, reporter_id, reason)
     select post.id, p.id, :'reason' from post, public.profiles p where p.display_name = :'reporter';`,
    { author, reporter, body, reason },
  );
}

/** Joins with a specific invite code and completes onboarding. */
export async function joinWithInvite(page: Page, inviteCode: string, displayName: string) {
  const email = uniqueEmail("invited");
  await page.goto("/login?mode=join");
  await page.getByLabel("Invite code").fill(inviteCode);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Join Connection" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await page.goto(await getMagicLink(email));
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Display name").fill(displayName);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/checkin/);
}

/** The author deletes their own post, as they could from the feed. */
export function deletePost(body: string) {
  sql("delete from public.posts where body = :'body';", { body });
}
