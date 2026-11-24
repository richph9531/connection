import { describe, expect, it } from "vitest";
import { emptyReactionSummary, summarizeReactions, toggleReaction } from "./reactions";

describe("summarizeReactions", () => {
  it("counts each kind per post and marks the viewer's own reactions", () => {
    const result = summarizeReactions(
      [
        { post_id: "p1", user_id: "me", kind: "support" },
        { post_id: "p1", user_id: "you", kind: "support" },
        { post_id: "p1", user_id: "you", kind: "prayer" },
        { post_id: "p2", user_id: "you", kind: "well_done" },
      ],
      "me",
    );
    expect(result.get("p1")).toMatchObject({
      support: { count: 2, mine: true },
      prayer: { count: 1, mine: false },
      strength: { count: 0, mine: false },
    });
    expect(result.get("p2")?.well_done).toEqual({ count: 1, mine: false });
    expect(result.has("p3")).toBe(false);
  });
});

describe("toggleReaction", () => {
  it("adds and removes the viewer's reaction without touching others", () => {
    const start = emptyReactionSummary();
    const added = toggleReaction(start, "strength");
    expect(added.strength).toEqual({ count: 1, mine: true });
    expect(toggleReaction(added, "strength").strength).toEqual({ count: 0, mine: false });
    expect(added.support).toEqual({ count: 0, mine: false });
    expect(start.strength).toEqual({ count: 0, mine: false });
  });
});
