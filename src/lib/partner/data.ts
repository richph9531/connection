import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { isValidTimeZone, todayIn } from "@/lib/dates";
import {
  groupPartnerships,
  OPEN_STATUSES,
  SHARED_DAYS,
  type PartnerLink,
  type PartnershipRow,
} from "./partnerships";
import { addDays, partnerStreak, type PartnerStreak } from "./streak";

export type SharedCheckIn = Database["public"]["Functions"]["partner_check_ins"]["Returns"][number];

export type ActivePartner = PartnerLink & {
  streak: PartnerStreak;
  today: string;
  checkIns: SharedCheckIn[];
};

export type PartnerPageData = {
  active: ActivePartner[];
  incoming: PartnerLink[];
  outgoing: PartnerLink[];
};

type Client = SupabaseClient<Database>;

export async function loadOpenPartnerships(supabase: Client): Promise<PartnershipRow[]> {
  const { data } = await supabase
    .from("partnerships")
    .select("id, requester_id, partner_id, status, created_at")
    .in("status", OPEN_STATUSES);
  return data ?? [];
}

async function loadNames(supabase: Client, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from("member_directory").select("id, display_name").in("id", ids);
  return new Map(
    (data ?? []).flatMap((member) => (member.id && member.display_name ? [[member.id, member.display_name]] : [])),
  );
}

async function loadActivePartner(supabase: Client, link: PartnerLink): Promise<ActivePartner> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("recovery_start_date, longest_streak, timezone")
    .eq("id", link.otherId)
    .maybeSingle();
  const timezone = profile?.timezone && isValidTimeZone(profile.timezone) ? profile.timezone : "UTC";
  const today = todayIn(timezone);
  const { data: checkIns } = await supabase.rpc("partner_check_ins", {
    partner: link.otherId,
    since: addDays(today, -(SHARED_DAYS - 1)),
  });
  return {
    ...link,
    today,
    streak: partnerStreak(profile?.recovery_start_date ?? null, profile?.longest_streak ?? 0, today),
    checkIns: checkIns ?? [],
  };
}

export async function loadPartnerPage(supabase: Client, me: string): Promise<PartnerPageData> {
  const rows = await loadOpenPartnerships(supabase);
  const otherIds = [...new Set(rows.map((row) => (row.requester_id === me ? row.partner_id : row.requester_id)))];
  const grouped = groupPartnerships(rows, me, await loadNames(supabase, otherIds));
  const active = await Promise.all(grouped.active.map((link) => loadActivePartner(supabase, link)));
  return { ...grouped, active };
}
