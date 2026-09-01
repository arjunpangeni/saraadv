export type SetupProgress = {
  percent: number;
  completed: number;
  total: number;
};

export const SETUP_PIPELINE_STATUSES = [
  { value: "INTAKE", label: "New inquiry" },
  { value: "RULES_GENERATED", label: "Checklist ready" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export function pipelineLabel(status: string): string {
  return SETUP_PIPELINE_STATUSES.find((s) => s.value === status)?.label ?? status.replace(/_/g, " ");
}

export function computeSetupProgress(
  tasks: { status: string; code: string }[],
  optionalCodes: Set<string>
): SetupProgress {
  const mandatory = tasks.filter((t) => !optionalCodes.has(t.code));
  if (mandatory.length === 0) return { percent: 100, completed: 0, total: 0 };
  const completed = mandatory.filter(
    (t) => t.status === "DONE" || t.status === "NOT_APPLICABLE"
  ).length;
  return {
    percent: Math.round((completed / mandatory.length) * 100),
    completed,
    total: mandatory.length,
  };
}
