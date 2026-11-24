import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.");

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(6, "Invite codes are at least 6 characters.")
  .max(64, "That invite code is too long.");

export const loginSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("login"), email: emailSchema }),
  z.object({ mode: z.literal("join"), email: emailSchema, inviteCode: inviteCodeSchema }),
]);

export const displayNameSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9_ .-]{3,30}$/,
    "Use 3–30 letters, numbers, spaces, dots, dashes or underscores.",
  );

export const onboardingSchema = z.object({
  displayName: displayNameSchema,
  recoveryStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date.")
    .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), "The date can't be in the future."),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
});
