import { z } from "zod";
import { INVITE_EXPIRY_OPTIONS } from "./invites";
import { MEMBER_ROLES } from "./roles";

const id = z.string().uuid();

export const contentActionSchema = z.object({
  kind: z.enum(["post", "comment"]),
  targetId: id,
});

export const reportActionSchema = contentActionSchema.extend({
  decision: z.enum(["remove", "dismiss", "resolve", "restore"]),
});

export const createInviteSchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((days) => (INVITE_EXPIRY_OPTIONS as readonly number[]).includes(days), "Please choose how long the invite lasts."),
});

export const withdrawInviteSchema = z.object({ code: z.string().trim().min(6).max(64) });

export const setRoleSchema = z.object({
  memberId: id,
  role: z.enum(MEMBER_ROLES),
});
