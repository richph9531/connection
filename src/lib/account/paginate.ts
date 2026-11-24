export const EXPORT_PAGE_SIZE = 500;

type Page<T> = { data: T[] | null; error: unknown };

/** Reads every row by requesting consecutive ranges until a short page comes back. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<Page<T>>,
  pageSize: number = EXPORT_PAGE_SIZE,
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}
