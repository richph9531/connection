import { describe, expect, it } from "vitest";
import { commentBodySchema, postBodySchema, reactionSchema, reportSchema } from "./validation";

const id = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

describe("postBodySchema", () => {
  it("trims and accepts up to 2000 characters", () => {
    expect(postBodySchema.parse("  Day 5, going well  ")).toBe("Day 5, going well");
    expect(postBodySchema.safeParse("a".repeat(2000)).success).toBe(true);
  });

  it("counts browser line breaks (CRLF) as one character", () => {
    const body = `${"a".repeat(999)}\r\n${"b".repeat(1000)}`;
    expect(postBodySchema.parse(body)).toBe(`${"a".repeat(999)}\n${"b".repeat(1000)}`);
    expect(commentBodySchema.parse("one\r\ntwo")).toBe("one\ntwo");
  });

  it("rejects empty and overlong posts", () => {
    expect(postBodySchema.safeParse("   ").success).toBe(false);
    expect(postBodySchema.safeParse("a".repeat(2001)).success).toBe(false);
  });
});

describe("commentBodySchema", () => {
  it("allows up to 1000 characters", () => {
    expect(commentBodySchema.safeParse("a".repeat(1000)).success).toBe(true);
    expect(commentBodySchema.safeParse("a".repeat(1001)).success).toBe(false);
  });
});

describe("reactionSchema", () => {
  it("only accepts the four encouragement reactions", () => {
    expect(reactionSchema.safeParse({ postId: id, kind: "well_done" }).success).toBe(true);
    expect(reactionSchema.safeParse({ postId: id, kind: "dislike" }).success).toBe(false);
    expect(reactionSchema.safeParse({ postId: "nope", kind: "support" }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("needs a target and a reason", () => {
    expect(reportSchema.safeParse({ target: "comment", targetId: id, reason: "Unkind" }).success).toBe(true);
    expect(reportSchema.safeParse({ target: "comment", targetId: id, reason: " " }).success).toBe(false);
    expect(reportSchema.safeParse({ target: "profile", targetId: id, reason: "x" }).success).toBe(false);
  });
});
