import { describe, expect, it } from "vitest";
import { fetchAllPages } from "./paginate";

const source = Array.from({ length: 23 }, (_, i) => i);
const pager = (rows: number[]) => async (from: number, to: number) => ({
  data: rows.slice(from, to + 1),
  error: null,
});

describe("fetchAllPages", () => {
  it("collects rows across several pages", async () => {
    const result = await fetchAllPages(pager(source), 10);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(source);
  });

  it("handles an exact multiple of the page size and empty tables", async () => {
    expect((await fetchAllPages(pager(source.slice(0, 20)), 10)).data).toHaveLength(20);
    expect((await fetchAllPages(pager([]), 10)).data).toEqual([]);
  });

  it("stops and reports the first error", async () => {
    let calls = 0;
    const result = await fetchAllPages(async (from, to) => {
      calls += 1;
      return calls === 2 ? { data: null, error: new Error("boom") } : { data: source.slice(from, to + 1), error: null };
    }, 10);
    expect(result.error).toBeInstanceOf(Error);
    expect(calls).toBe(2);
  });
});
