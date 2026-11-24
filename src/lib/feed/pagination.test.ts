import { describe, expect, it } from "vitest";
import { feedHref, PAGE_SIZE, pageRange, parsePage } from "./pagination";

describe("parsePage", () => {
  it.each([
    [undefined, 1],
    ["", 1],
    ["0", 1],
    ["3", 3],
    [["4", "5"], 4],
    ["-2", 1],
    ["abc", 1],
    ["1.5", 1],
    ["99999999", 1],
  ])("parses %j as page %i", (input, expected) => {
    expect(parsePage(input)).toBe(expected);
  });
});

describe("pageRange", () => {
  it("asks for one extra row so we know if older posts exist", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: PAGE_SIZE });
    expect(pageRange(3, 5)).toEqual({ from: 10, to: 15 });
  });
});

describe("feedHref", () => {
  it("keeps the first page at /feed", () => {
    expect(feedHref(1)).toBe("/feed");
    expect(feedHref(2)).toBe("/feed?page=2");
  });
});
