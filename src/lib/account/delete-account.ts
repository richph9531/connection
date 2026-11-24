import { z } from "zod";
import { DELETE_CONFIRMATION_PHRASE, isDeleteConfirmed } from "./confirmation";

export { DELETE_CONFIRMATION_PHRASE, isDeleteConfirmed };

export const deleteAccountSchema = z.object({
  confirmation: z.string().refine(isDeleteConfirmed, {
    message: `Please type ${DELETE_CONFIRMATION_PHRASE} to confirm.`,
  }),
});
