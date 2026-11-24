import { execFileSync } from "node:child_process";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

/** Sets a member's recovery start date to `days` days before today in their own time zone. */
export function setStreakDays(displayName: string, days: number) {
  execFileSync("psql", [
    DB_URL,
    "-qc",
    `update public.profiles set recovery_start_date = (now() at time zone timezone)::date - ${Number(days)}
     where display_name = ${sqlString(displayName)}`,
  ]);
}

type CheckIn = {
  daysAgo: number;
  clean: boolean;
  mood: number;
  urge: number;
  triggers: string[];
  note: string;
  share: boolean;
};

/** Adds a check-in for a member directly in the local database. */
export function addCheckIn(displayName: string, checkIn: CheckIn) {
  const triggers = `array[${checkIn.triggers.map(sqlString).join(",")}]::text[]`;
  execFileSync("psql", [
    DB_URL,
    "-qc",
    `insert into public.check_ins (user_id, date, clean, mood, urge_level, triggers, note, share_with_partner)
     select id, (now() at time zone timezone)::date - ${Number(checkIn.daysAgo)}, ${checkIn.clean}, ${Number(checkIn.mood)},
       ${Number(checkIn.urge)}, ${triggers}, ${sqlString(checkIn.note)}, ${checkIn.share}
     from public.profiles where display_name = ${sqlString(displayName)}`,
  ]);
}
