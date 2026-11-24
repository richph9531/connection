import { execFileSync } from "node:child_process";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** Runs a query against the local database and returns the first column of the first row. */
export function sql(query: string): string {
  return execFileSync("psql", [DB_URL, "-qtAc", query]).toString().trim();
}

const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;

export function userIdFor(email: string): string {
  return sql(`select id from auth.users where email = ${literal(email)}`);
}

/** Adds a check-in, a post and a comment for the member so the export has something in it. */
export function seedMemberContent(userId: string, note: string) {
  sql(
    `insert into public.check_ins (user_id, date, clean, mood, urge_level, triggers, note)
     values ('${userId}', current_date, true, 4, 2, '{stress}', ${literal(note)});
     insert into public.posts (author_id, body) values ('${userId}', 'Grateful for this group');
     insert into public.comments (post_id, author_id, body)
       select id, '${userId}', 'Thank you all' from public.posts where author_id = '${userId}';`,
  );
}

export function countMemberRows(userId: string): number {
  return Number(
    sql(`select (select count(*) from auth.users where id = '${userId}')
      + (select count(*) from public.profiles where id = '${userId}')
      + (select count(*) from public.check_ins where user_id = '${userId}')
      + (select count(*) from public.posts where author_id = '${userId}')
      + (select count(*) from public.comments where author_id = '${userId}')`),
  );
}
