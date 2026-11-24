import { expect, type Page } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function uniqueEmail(prefix = "member") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Creates a fresh invite code directly in the local database. */
export async function createInvite(): Promise<string> {
  const { execFileSync } = await import("node:child_process");
  const code = `E2E-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  execFileSync("psql", [DB_URL, "-qc", `insert into public.invites (code) values ('${code}')`]);
  return code;
}

/** Reads the latest magic link sent to an address from the local Mailpit inbox. */
export async function getMagicLink(email: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
        const { messages } = (await search.json()) as { messages: { ID: string }[] };
        if (!messages?.length) return false;
        const message = await (await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)).json();
        link = (message.Text as string).match(/https?:\/\/\S+verify\S+/)?.[0];
        return Boolean(link);
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  return link!.replace(/[)\]]+$/, "");
}

/** Joins with a fresh invite and completes onboarding. Returns the display name. */
export async function joinAsNewMember(page: Page, displayName = `Member ${Date.now() % 1e6}`) {
  const email = uniqueEmail();
  const inviteCode = await createInvite();
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
  return { email, displayName };
}
