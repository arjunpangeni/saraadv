import type { EligibilityIssue, GeneratedTask } from "@/lib/rules/startABusiness";

export const BUSINESS_SETUP_GUIDE_KEY = "asar:business-setup-guide";

/** Optional / ancillary items ASAR can deliver as paid single-window services. */
export const ASAR_SERVICE_CODES = new Set([
  "REG-23",
  "REG-24",
  "REG-27",
  "REG-29",
  "REG-31",
  "REG-32",
  "REG-33",
  "REG-34",
  "REG-35",
  "REG-36",
  "REG-38",
  "REG-39",
]);

export const ASAR_ADVISOR_MAIL = "advisor@asarpartners.com";

export interface SetupGuidePayload {
  contactName: string;
  businessName: string;
  screeningLevel: "NONE" | "BRIEF" | "IEE" | "EIA";
  issues: EligibilityIssue[];
  required: GeneratedTask[];
  recommended: GeneratedTask[];
}

export function splitGuideTasks(tasks: GeneratedTask[]): {
  required: GeneratedTask[];
  recommended: GeneratedTask[];
} {
  return {
    required: tasks.filter((t) => !t.optional),
    recommended: tasks.filter((t) => t.optional),
  };
}

export function saveGuidePayload(payload: SetupGuidePayload) {
  try {
    sessionStorage.setItem(BUSINESS_SETUP_GUIDE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadGuidePayload(): SetupGuidePayload | null {
  try {
    const raw = sessionStorage.getItem(BUSINESS_SETUP_GUIDE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SetupGuidePayload;
  } catch {
    return null;
  }
}

export function asarMailto(tasks: GeneratedTask[], businessName: string) {
  const list = tasks.map((t) => `- ${t.title}`).join("\n");
  const subject = `Start a Business services: ${businessName}`;
  const body = `Hello ASAR Partners,\n\nPlease handle the following items for ${businessName}:\n\n${list}\n\nThank you.`;
  return `mailto:${ASAR_ADVISOR_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
