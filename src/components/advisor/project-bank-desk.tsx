export type ProjectBankFilter = "pending" | "live" | "rejected";

export function parseProjectBankFilter(raw?: string): ProjectBankFilter {
  if (raw === "live" || raw === "PUBLISHED") return "live";
  if (raw === "rejected" || raw === "REJECTED") return "rejected";
  return "pending";
}

export function projectBankHref({
  status,
  q,
}: {
  status?: ProjectBankFilter;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (status === "live" || status === "rejected") params.set("status", status);
  const query = q?.trim();
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/advisor/project-bank?${qs}` : "/advisor/project-bank";
}
