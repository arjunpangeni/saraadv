import type { SetupStatus } from "@/generated/prisma";

export type SetupDeskView = "new" | "working" | "contacted" | "done" | "archived";

export const SETUP_STATUS_LABELS: Record<SetupStatus, string> = {
  INTAKE: "New",
  RULES_GENERATED: "Rules ready",
  IN_PROGRESS: "In progress",
  CONTACTED: "Contacted",
  COMPLETED: "Done",
  ARCHIVED: "Archived",
};

export const SETUP_STATUS_OPTIONS = (Object.keys(SETUP_STATUS_LABELS) as SetupStatus[]).map((value) => ({
  value,
  label: SETUP_STATUS_LABELS[value],
}));

export function parseSetupDeskView(raw?: string): SetupDeskView {
  if (raw === "working" || raw === "in-progress") return "working";
  if (raw === "contacted") return "contacted";
  if (raw === "done") return "done";
  if (raw === "archived") return "archived";
  return "new";
}

export function setupViewStatuses(view: SetupDeskView): SetupStatus[] {
  if (view === "working") return ["RULES_GENERATED", "IN_PROGRESS"];
  if (view === "contacted") return ["CONTACTED"];
  if (view === "done") return ["COMPLETED"];
  if (view === "archived") return ["ARCHIVED"];
  return ["INTAKE"];
}

export function setupStatusBadge(status: string) {
  if (status === "CONTACTED") return { label: SETUP_STATUS_LABELS.CONTACTED, variant: "sky" as const };
  if (status === "IN_PROGRESS") return { label: SETUP_STATUS_LABELS.IN_PROGRESS, variant: "sky" as const };
  if (status === "RULES_GENERATED") {
    return { label: SETUP_STATUS_LABELS.RULES_GENERATED, variant: "warning" as const };
  }
  if (status === "COMPLETED") return { label: SETUP_STATUS_LABELS.COMPLETED, variant: "success" as const };
  if (status === "ARCHIVED") return { label: SETUP_STATUS_LABELS.ARCHIVED, variant: "secondary" as const };
  return { label: SETUP_STATUS_LABELS.INTAKE, variant: "warning" as const };
}

export function setupDeskHref({
  view,
  q,
  fdi,
}: {
  view?: SetupDeskView;
  q?: string;
  fdi?: boolean;
}) {
  const params = new URLSearchParams();
  if (view && view !== "new") params.set("view", view);
  const query = q?.trim();
  if (query) params.set("q", query);
  if (fdi) params.set("fdi", "1");
  const qs = params.toString();
  return qs ? `/advisor/business-setups?${qs}` : "/advisor/business-setups";
}
