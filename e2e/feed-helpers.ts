import { devices, type Browser } from "@playwright/test";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export const PHONE = { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } };

/** Opens a fresh, logged-out phone-sized page (its own cookies). */
export async function newPhonePage(browser: Browser) {
  const context = await browser.newContext({ ...PHONE, baseURL: "http://127.0.0.1:3000" });
  return context.newPage();
}

async function psql(sql: string, ...vars: string[]): Promise<string> {
  const { execFileSync } = await import("node:child_process");
  const args = [DB_URL, "-qtAX", ...vars.flatMap((v, i) => ["-v", `v${i}=${v}`])];
  return execFileSync("psql", args, { input: sql }).toString().trim();
}

/**
 * Inserts posts directly for a member, oldest first. They are dated slightly in the future so they stay
 * at the top of the feed even if other tests post at the same time.
 */
export async function insertPosts(displayName: string, bodies: string[]) {
  const values = bodies.map((_, i) => `(:'body${i}', now() + interval '1 hour' - interval '${bodies.length - i} minutes')`).join(", ");
  const { execFileSync } = await import("node:child_process");
  const args = [DB_URL, "-qtAX", "-v", `name=${displayName}`, ...bodies.flatMap((body, i) => ["-v", `body${i}=${body}`])];
  const sql = `insert into public.posts (author_id, body, created_at)
    select p.id, v.body, v.created_at from public.profiles p, (values ${values}) as v(body, created_at)
    where p.display_name = :'name';`;
  execFileSync("psql", args, { input: sql });
}

export async function openReportCount(postBody: string): Promise<number> {
  const out = await psql(
    `select count(*) from public.reports r join public.posts p on p.id = r.post_id
     where p.body = :'v0' and r.status = 'open';`,
    postBody,
  );
  return Number(out);
}

export async function deletePostsBy(displayName: string) {
  await psql(
    "delete from public.posts where author_id = (select id from public.profiles where display_name = :'v0');",
    displayName,
  );
}
