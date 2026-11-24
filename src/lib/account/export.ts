import { todayIn } from "@/lib/dates";

export const EXPORT_FORMAT_VERSION = 1;

export type ExportProfile = {
  display_name: string | null;
  role: string;
  recovery_start_date: string | null;
  longest_streak: number;
  timezone: string;
  created_at: string;
};

export type ExportCheckIn = {
  date: string;
  clean: boolean;
  mood: number;
  urge_level: number;
  triggers: string[];
  note: string | null;
  share_with_partner: boolean;
  created_at: string;
  updated_at: string;
};

export type ExportPost = {
  id: string;
  body: string;
  milestone_days: number | null;
  created_at: string;
  removed_at: string | null;
};

export type ExportComment = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  removed_at: string | null;
};

export type ExportInput = {
  email: string | null;
  profile: ExportProfile;
  checkIns: ExportCheckIn[];
  posts: ExportPost[];
  comments: ExportComment[];
};

export type MemberExport = {
  format_version: number;
  exported_at: string;
  about: string;
  account: { email: string | null };
  profile: ExportProfile;
  check_ins: ExportCheckIn[];
  posts: ExportPost[];
  comments: ExportComment[];
};

const byDate = <T extends { created_at: string }>(rows: T[]) =>
  [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

/** Builds the JSON document a member downloads from their account page. */
export function buildMemberExport(input: ExportInput, now: Date = new Date()): MemberExport {
  return {
    format_version: EXPORT_FORMAT_VERSION,
    exported_at: now.toISOString(),
    about:
      "Everything Connection stores about you: your profile, check-ins (including private notes), posts and comments. Keep this file somewhere safe.",
    account: { email: input.email },
    profile: input.profile,
    check_ins: [...input.checkIns].sort((a, b) => a.date.localeCompare(b.date)),
    posts: byDate(input.posts),
    comments: byDate(input.comments),
  };
}

/** File name for the export, dated in the member's own time zone. */
export function exportFileName(timeZone: string, now: Date = new Date()): string {
  return `connection-export-${todayIn(timeZone, now)}.json`;
}
