import { z } from "zod";
import { NOTE_MAX_LENGTH, TRIGGER_VALUES } from "./options";

export const checkInSchema = z.object({
  clean: z.enum(["yes", "no"], "Please choose whether you stayed clean today.").transform((value) => value === "yes"),
  mood: z.coerce
    .number("Please choose a mood.")
    .int("Please choose a mood.")
    .min(1, "Please choose a mood.")
    .max(5, "Please choose a mood."),
  urgeLevel: z.coerce
    .number("Please choose an urge level.")
    .int("Please choose an urge level.")
    .min(0, "Urge level goes from 0 to 10.")
    .max(10, "Urge level goes from 0 to 10."),
  triggers: z
    .array(z.enum(TRIGGER_VALUES, "Please choose triggers from the list."))
    .transform((values) => [...new Set(values)]),
  note: z
    .string()
    .max(NOTE_MAX_LENGTH, `Notes can be up to ${NOTE_MAX_LENGTH} characters.`)
    .transform((value) => value.trim() || null),
  shareWithPartner: z.boolean(),
});

export type CheckInInput = z.output<typeof checkInSchema>;

/** Reads the raw check-in form fields so they can be validated and echoed back on error. */
export function readCheckInForm(formData: FormData) {
  return {
    clean: String(formData.get("clean") ?? ""),
    mood: String(formData.get("mood") ?? ""),
    urgeLevel: String(formData.get("urgeLevel") ?? ""),
    triggers: formData.getAll("triggers").map(String),
    note: String(formData.get("note") ?? ""),
    shareWithPartner: formData.get("shareWithPartner") === "on",
  };
}

export type CheckInFormValues = ReturnType<typeof readCheckInForm>;

export function parseCheckInForm(formData: FormData) {
  const values = readCheckInForm(formData);
  return {
    values,
    result: checkInSchema.safeParse({ ...values, mood: values.mood || undefined, urgeLevel: values.urgeLevel || undefined }),
  };
}
