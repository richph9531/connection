import { z } from "zod";
import { REACTION_KINDS } from "./reactions";

export const POST_MAX_LENGTH = 2000;
export const COMMENT_MAX_LENGTH = 1000;
export const REPORT_REASON_MAX_LENGTH = 500;

export const postBodySchema = z
  .string()
  .trim()
  .min(1, "Write a few words before posting.")
  .max(POST_MAX_LENGTH, `Posts can be up to ${POST_MAX_LENGTH} characters.`);

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Write a few words before replying.")
  .max(
    COMMENT_MAX_LENGTH,
    `Replies can be up to ${COMMENT_MAX_LENGTH} characters.`,
  );

export const reportReasonSchema = z
  .string()
  .trim()
  .min(1, "Please tell the moderators what worries you.")
  .max(
    REPORT_REASON_MAX_LENGTH,
    `Please keep it under ${REPORT_REASON_MAX_LENGTH} characters.`,
  );

export const idSchema = z.string().uuid();

export const reactionSchema = z.object({
  postId: idSchema,
  kind: z.enum(REACTION_KINDS),
});

export const reportSchema = z.object({
  target: z.enum(["post", "comment"]),
  targetId: idSchema,
  reason: reportReasonSchema,
});
