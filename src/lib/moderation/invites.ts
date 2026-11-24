export const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_EXPIRY_OPTIONS = [1, 7, 14, 30] as const;
export const DEFAULT_INVITE_EXPIRY_DAYS = 14;

export type InviteStatus = "unused" | "used" | "expired";

export type InviteRow = {
  code: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
};

/** A readable code like "K7QM-2XPA-R9TD" (no 0/O or 1/I mix-ups). */
export function generateInviteCode(randomBytes: (size: number) => Uint8Array): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (byte) => INVITE_CODE_ALPHABET[byte % INVITE_CODE_ALPHABET.length]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map((group) => group.join("")).join("-");
}

export function inviteExpiry(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function inviteStatus(invite: Pick<InviteRow, "used_at" | "expires_at">, now: Date = new Date()): InviteStatus {
  if (invite.used_at) return "used";
  return new Date(invite.expires_at).getTime() <= now.getTime() ? "expired" : "unused";
}

export function groupInvites<T extends Pick<InviteRow, "used_at" | "expires_at">>(
  invites: T[],
  now: Date = new Date(),
): Record<InviteStatus, T[]> {
  const groups: Record<InviteStatus, T[]> = { unused: [], used: [], expired: [] };
  for (const invite of invites) groups[inviteStatus(invite, now)].push(invite);
  return groups;
}
