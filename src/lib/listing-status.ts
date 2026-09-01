export const LISTING_EDIT_BLOCKED = ["CLOSED", "UNDER_LOI", "NDA_LOCKED"] as const;

export function canEditOwnListing(status: string) {
  return !(LISTING_EDIT_BLOCKED as readonly string[]).includes(status);
}
