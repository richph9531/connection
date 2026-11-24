import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";
import { startJoining } from "./helpers";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

function sql(query: string): string {
  return execFileSync("psql", [DB_URL, "-qtAc", query]).toString().trim();
}

/** Joins with a fresh invite, choosing the recovery start date and time zone during onboarding. */
export async function joinWithStartDate(page: Page, recoveryStartDate: string, timeZone: string) {
  await startJoining(page);
  const displayName = `Streak ${Date.now() % 1e6}`;
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("When did your current recovery start?").fill(recoveryStartDate);
  await page.getByLabel("Your time zone").selectOption(timeZone);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/checkin/);
  return displayName;
}

/** Adds a check-in for a member directly in the local database. */
export function addCheckIn(displayName: string, date: string, clean: boolean) {
  sql(
    `insert into public.check_ins (user_id, date, clean, mood, urge_level)
     select id, '${date}', ${clean}, 3, 2 from public.profiles where display_name = '${displayName}'`,
  );
}

export function countMilestonePosts(displayName: string, days: number): number {
  return Number(
    sql(
      `select count(*) from public.posts p join public.profiles pr on pr.id = p.author_id
       where pr.display_name = '${displayName}' and p.milestone_days = ${days}`,
    ),
  );
}
