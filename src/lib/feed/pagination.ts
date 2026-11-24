export const PAGE_SIZE = 10;

/** Reads a 1-based page number from the query string, falling back to page 1. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,6}$/.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

/** Inclusive row range for a page. Fetches one extra row to know whether an older page exists. */
export function pageRange(
  page: number,
  pageSize = PAGE_SIZE,
): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize };
}

export function feedHref(page: number): string {
  return page <= 1 ? "/feed" : `/feed?page=${page}`;
}
