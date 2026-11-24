import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { displayNameSchema } from "@/lib/validation";

export type PartnershipStatus = Database["public"]["Enums"]["partnership_status"];

export type PartnershipRow = {
  id: string;
  requester_id: string;
  partner_id: string;
  status: PartnershipStatus;
  created_at: string;
};

export type Member = { id: string; display_name: string | null };

export type PartnerLink = { id: string; otherId: string; otherName: string; since: string };

export type GroupedPartnerships = {
  active: PartnerLink[];
  incoming: PartnerLink[];
  outgoing: PartnerLink[];
};

export const OPEN_STATUSES: PartnershipStatus[] = ["pending", "active"];

export const SHARED_DAYS = 30;

export const requestPartnerSchema = z.object({ displayName: displayNameSchema });

export function otherMemberId(row: Pick<PartnershipRow, "requester_id" | "partner_id">, me: string): string {
  return row.requester_id === me ? row.partner_id : row.requester_id;
}

/** Splits a member's open partnerships into active partners, requests to answer and requests sent. */
export function groupPartnerships(
  rows: PartnershipRow[],
  me: string,
  names: Map<string, string>,
): GroupedPartnerships {
  const grouped: GroupedPartnerships = { active: [], incoming: [], outgoing: [] };
  const seen = new Set<string>();
  const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const status of ["active", "pending"] as const) {
    for (const row of sorted) {
      if (row.status !== status) continue;
      const otherId = otherMemberId(row, me);
      const otherName = names.get(otherId);
      if (!otherName || seen.has(otherId)) continue;
      seen.add(otherId);
      const link = { id: row.id, otherId, otherName, since: row.created_at };
      if (status === "active") grouped.active.push(link);
      else if (row.partner_id === me) grouped.incoming.push(link);
      else grouped.outgoing.push(link);
    }
  }
  return grouped;
}

/** Escapes LIKE wildcards so a display name is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Picks the member a typed display name refers to: exact match first, else a unique case-insensitive match. */
export function pickMember<T extends Member>(matches: T[], name: string): T | undefined {
  const exact = matches.find((member) => member.display_name === name);
  if (exact) return exact;
  const folded = matches.filter((member) => member.display_name?.toLowerCase() === name.toLowerCase());
  return folded.length === 1 ? folded[0] : undefined;
}

export type RequestCheck =
  | { ok: true }
  | { ok: false; reason: "self" | "already-partners" | "already-requested" | "they-requested" };

/** Decides whether a new request to `other` makes sense given the member's open partnerships. */
export function checkNewRequest(rows: PartnershipRow[], me: string, other: string): RequestCheck {
  if (me === other) return { ok: false, reason: "self" };
  const open = rows.filter(
    (row) => OPEN_STATUSES.includes(row.status) && otherMemberId(row, me) === other,
  );
  if (open.some((row) => row.status === "active")) return { ok: false, reason: "already-partners" };
  if (open.some((row) => row.requester_id === me)) return { ok: false, reason: "already-requested" };
  if (open.length > 0) return { ok: false, reason: "they-requested" };
  return { ok: true };
}

export const REQUEST_MESSAGES = {
  self: "That's your own display name. Enter the display name of the member you'd like to partner with.",
  "already-partners": "You're already partners. You can see their progress below.",
  "already-requested": "You've already sent them a request. We'll show it here when they answer.",
  "they-requested": "They've already asked you to be partners. You can accept their request below.",
  "not-found": "We couldn't find a member with that display name. Please check the spelling and try again.",
  error: "Something went wrong. Please try again.",
} as const;
