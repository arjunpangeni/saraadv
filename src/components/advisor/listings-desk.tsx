export type ListingDeskFilter = "pending" | "live" | "rejected";

export function parseListingDeskFilter(raw?: string): ListingDeskFilter {
  if (raw === "live" || raw === "PUBLISHED") return "live";
  if (raw === "rejected" || raw === "WITHDRAWN") return "rejected";
  return "pending";
}

export function listingDeskStatus(filter: ListingDeskFilter) {
  if (filter === "live") return "PUBLISHED" as const;
  if (filter === "rejected") return "WITHDRAWN" as const;
  return "PENDING_REVIEW" as const;
}

export function listingDeskHref({
  status,
  q,
}: {
  status?: ListingDeskFilter;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (status === "live") params.set("status", "PUBLISHED");
  if (status === "rejected") params.set("status", "WITHDRAWN");
  const query = q?.trim();
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/advisor/listings?${qs}` : "/advisor/listings";
}
