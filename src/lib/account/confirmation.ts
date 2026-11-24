export const DELETE_CONFIRMATION_PHRASE = "DELETE";

export function isDeleteConfirmed(value: string): boolean {
  return value.trim().toUpperCase() === DELETE_CONFIRMATION_PHRASE;
}
