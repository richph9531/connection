import type { CheckInFormValues } from "./schema";

export type CheckInRow = {
  clean: boolean;
  mood: number;
  urge_level: number;
  triggers: string[];
  note: string | null;
  share_with_partner: boolean;
};

/** Turns a saved check-in into form values so today's check-in can be edited. */
export function rowToFormValues(row: CheckInRow): CheckInFormValues {
  return {
    clean: row.clean ? "yes" : "no",
    mood: String(row.mood),
    urgeLevel: String(row.urge_level),
    triggers: row.triggers,
    note: row.note ?? "",
    shareWithPartner: row.share_with_partner,
  };
}

export const HISTORY_PAGE_SIZE = 30;

/** Parses the ?page= search param (1-based). Falls back to page 1. */
export function pageFromParam(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
