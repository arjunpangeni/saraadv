import { prisma } from "@/lib/prisma";
import { notifyRoles } from "@/lib/notifications";
import { compactDetails } from "@/lib/mail";
import { formatNpr } from "@/lib/calc";
import {
  evaluateEligibility,
  generateChecklist,
  resolveScreeningLevel,
  screeningLevelRequiresStudy,
  type StartABusinessInput,
  type RegulatoryRuleRecord,
  type EligibilityIssue,
  type GeneratedTask,
} from "@/lib/rules/startABusiness";
import { splitGuideTasks, type SetupGuidePayload } from "@/lib/start-a-business-guide";
import { Prisma } from "@/generated/prisma";

export { computeSetupProgress, pipelineLabel, SETUP_PIPELINE_STATUSES, type SetupProgress } from "@/lib/business-setup-progress";

const setupDetailInclude = {
  addresses: true,
  investment: true,
  shareholders: true,
  classification: true,
  complianceTasks: { orderBy: { createdAt: "asc" as const } },
  assignedAdvisor: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BusinessSetupInclude;

export type BusinessSetupDetail = Prisma.BusinessSetupGetPayload<{
  include: typeof setupDetailInclude;
}>;

export interface SetupAddressInput {
  kind: "HEAD_OFFICE" | "BRANCH" | "FACTORY" | "GODOWN" | "STORE";
  district: string;
  localBody: string;
}

export interface BusinessSetupIntake {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  objective: "MANUFACTURING" | "TRADING" | "SERVICE";
  businessType: "PRIVATE_LIMITED" | "PUBLIC_LIMITED" | "PROPRIETORSHIP" | "PARTNERSHIP";
  fdiRequested: boolean;
  sectorTags: string[];
  addresses: SetupAddressInput[];
  equityInvestment: number;
  loanInvestment: number;
  fixedAssets: number;
  plantMachineryCost: number;
  netCurrentAssets: number;
  shareholders: { category: string; promoterCount: number; committedCapital: number }[];
  sizeCategory: "MICRO" | "COTTAGE" | "SMALL" | "MEDIUM" | "LARGE";
  objectiveCategory:
    | "ENERGY"
    | "MANUFACTURING"
    | "AGRICULTURE_FOREST"
    | "MINERAL"
    | "INFRASTRUCTURE"
    | "TOURISM"
    | "ICT"
    | "SERVICE"
    | "TRADING";
  licenseIndustries?: string[];
  fdiNegativeCodes?: string[];
  ieeEiaCriterionId?: string | null;
  ieeEiaLevel?: "NONE" | "BRIEF" | "IEE" | "EIA";
}

function asStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string");
}

/** sectorTags JSON: either a string[] (legacy) or { tags, licenseIndustries, fdiNegativeCodes }. */
export function parseStoredIntakeExtras(raw: unknown): {
  sectorTags: string[];
  licenseIndustries: string[];
  fdiNegativeCodes: string[];
} {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "tags" in raw) {
    const packed = raw as {
      tags?: unknown;
      licenseIndustries?: unknown;
      fdiNegativeCodes?: unknown;
    };
    return {
      sectorTags: asStringList(packed.tags),
      licenseIndustries: asStringList(packed.licenseIndustries),
      fdiNegativeCodes: asStringList(packed.fdiNegativeCodes),
    };
  }
  return { sectorTags: asStringList(raw), licenseIndustries: [], fdiNegativeCodes: [] };
}

export function buildEngineInputFromSetup(setup: BusinessSetupDetail): StartABusinessInput {
  const extras = parseStoredIntakeExtras(setup.sectorTags);
  return {
    objective: setup.objective,
    businessType: setup.businessType,
    fdiRequested: setup.fdiRequested,
    sectorTags: extras.sectorTags,
    shareholders: setup.shareholders.map((s) => ({
      category: s.category,
      promoterCount: s.promoterCount,
      committedCapital: Number(s.committedCapital),
    })),
    investment: setup.investment
      ? {
          equityInvestment: Number(setup.investment.equityInvestment),
          loanInvestment: Number(setup.investment.loanInvestment),
        }
      : { equityInvestment: 0, loanInvestment: 0 },
    sizeCategory: setup.classification?.sizeCategory,
    objectiveCategory: setup.classification?.objectiveCategory,
    licenseRequired: Boolean(setup.classification?.licenseRequired),
    fdiNegativeCodes: extras.fdiNegativeCodes,
  };
}

export function buildEngineInputFromIntake(intake: BusinessSetupIntake): StartABusinessInput {
  return {
    objective: intake.objective,
    businessType: intake.businessType,
    fdiRequested: intake.fdiRequested,
    sectorTags: intake.sectorTags,
    shareholders: intake.shareholders,
    investment: {
      equityInvestment: intake.equityInvestment,
      loanInvestment: intake.loanInvestment,
    },
    sizeCategory: intake.sizeCategory,
    objectiveCategory: intake.objectiveCategory,
    licenseRequired: (intake.licenseIndustries ?? []).length > 0,
    fdiNegativeCodes: intake.fdiRequested ? intake.fdiNegativeCodes ?? [] : [],
  };
}

export async function getEligibilityIssuesForSetup(setup: BusinessSetupDetail): Promise<EligibilityIssue[]> {
  const negativeList = await prisma.fdiNegativeListItem.findMany();
  const engineInput = buildEngineInputFromSetup(setup);
  return evaluateEligibility(
    engineInput,
    negativeList,
    setup.investment
      ? {
          equityInvestment: Number(setup.investment.equityInvestment),
          loanInvestment: Number(setup.investment.loanInvestment),
          fixedAssets: Number(setup.investment.fixedAssets),
          plantMachineryCost: Number(setup.investment.plantMachineryCost),
          netCurrentAssets: Number(setup.investment.netCurrentAssets),
        }
      : undefined
  );
}

export interface SetupGuidePreview {
  screeningLevel: "NONE" | "BRIEF" | "IEE" | "EIA";
  issues: EligibilityIssue[];
  tasks: GeneratedTask[];
  required: GeneratedTask[];
  recommended: GeneratedTask[];
}

export async function previewSetupGuide(intake: BusinessSetupIntake): Promise<SetupGuidePreview> {
  let ieeEiaLevel = resolveScreeningLevel(intake.ieeEiaLevel);
  if (intake.ieeEiaCriterionId) {
    const criterion = await prisma.ieeEiaCriterion.findUnique({
      where: { id: intake.ieeEiaCriterionId },
    });
    if (criterion) {
      ieeEiaLevel = resolveScreeningLevel(criterion.level);
    }
  }

  const engineInput = buildEngineInputFromIntake(intake);
  const [negativeList, rules] = await Promise.all([
    prisma.fdiNegativeListItem.findMany(),
    loadRules(),
  ]);

  const issues = evaluateEligibility(engineInput, negativeList, {
    equityInvestment: intake.equityInvestment,
    loanInvestment: intake.loanInvestment,
    fixedAssets: intake.fixedAssets,
    plantMachineryCost: intake.plantMachineryCost,
    netCurrentAssets: intake.netCurrentAssets,
  });

  const tasks = generateChecklist(rules, engineInput, screeningLevelRequiresStudy(ieeEiaLevel));
  const { required, recommended } = splitGuideTasks(tasks);

  return { screeningLevel: ieeEiaLevel, issues, tasks, required, recommended };
}

export type SubmitBusinessSetupResult =
  | { ok: false; blockers: EligibilityIssue[]; warnings: EligibilityIssue[]; preview: SetupGuidePreview }
  | { ok: true; setupId: string; guide: SetupGuidePayload };

export async function submitBusinessSetup(intake: BusinessSetupIntake): Promise<SubmitBusinessSetupResult> {
  const preview = await previewSetupGuide(intake);
  const blockers = preview.issues.filter((i) => i.severity === "BLOCKER");
  const warnings = preview.issues.filter((i) => i.severity === "WARNING");

  if (blockers.length > 0) {
    return { ok: false, blockers, warnings, preview };
  }

  const licenseIndustries = intake.licenseIndustries ?? [];
  const licenseRequired = licenseIndustries.length > 0;

  const setup = await prisma.businessSetup.create({
    data: {
      name: intake.name,
      contactName: intake.contactName,
      phone: intake.phone,
      email: intake.email,
      objective: intake.objective,
      businessType: intake.businessType,
      fdiRequested: intake.fdiRequested,
      sectorTags: {
        tags: intake.sectorTags,
        licenseIndustries: licenseIndustries,
        fdiNegativeCodes: intake.fdiRequested ? intake.fdiNegativeCodes ?? [] : [],
      },
      status: "RULES_GENERATED",
      addresses: {
        create: intake.addresses.map((a) => ({
          kind: a.kind,
          district: a.district,
          localBody: a.localBody,
        })),
      },
      investment: {
        create: {
          equityInvestment: intake.equityInvestment,
          loanInvestment: intake.loanInvestment,
          fixedAssets: intake.fixedAssets,
          plantMachineryCost: intake.plantMachineryCost,
          netCurrentAssets: intake.netCurrentAssets,
        },
      },
      shareholders: {
        create: intake.shareholders.map((s) => ({
          category: s.category as never,
          promoterCount: s.promoterCount,
          committedCapital: s.committedCapital,
        })),
      },
      classification: {
        create: {
          sizeCategory: intake.sizeCategory,
          objectiveCategory: intake.objectiveCategory,
          licenseRequired,
          ieeEiaLevel: preview.screeningLevel === "NONE" ? null : preview.screeningLevel,
        },
      },
      complianceTasks:
        preview.tasks.length > 0
          ? {
              create: preview.tasks.map((task) => ({
                code: task.code,
                title: task.title,
                authority: task.authority,
                status: "PENDING" as const,
              })),
            }
          : undefined,
    },
  });

  const totalCapital = intake.equityInvestment + intake.loanInvestment;
  await notifyRoles(["ADMIN", "ADVISOR"], {
    type: "business_setup.new_inquiry",
    title: `New business setup inquiry: ${intake.name}`,
    body: `${intake.contactName} · ${intake.phone} · ${intake.objective.replace(/_/g, " ")}`,
    href: `/advisor/business-setups/${setup.id}`,
    details: compactDetails({
      Business: intake.name,
      Contact: intake.contactName,
      Phone: intake.phone,
      Email: intake.email,
      Objective: intake.objective.replace(/_/g, " "),
      "Business type": intake.businessType.replace(/_/g, " "),
      FDI: intake.fdiRequested,
      Size: intake.sizeCategory,
      "Total capital": formatNpr(totalCapital),
      Equity: formatNpr(intake.equityInvestment),
      Loan: formatNpr(intake.loanInvestment),
    }),
  }).catch((err) => console.error("[business-setup] failed to notify advisors", err));

  await prisma.auditLog.create({
    data: {
      action: "businessSetup.create",
      entity: "BusinessSetup",
      entityId: setup.id,
      metadata: { contactName: intake.contactName, email: intake.email, source: "guest_inquiry" },
    },
  });

  return {
    ok: true,
    setupId: setup.id,
    guide: {
      contactName: intake.contactName,
      businessName: intake.name,
      screeningLevel: preview.screeningLevel,
      issues: preview.issues,
      required: preview.required,
      recommended: preview.recommended,
    },
  };
}

export async function getBusinessSetupForAdvisor(setupId: string): Promise<BusinessSetupDetail | null> {
  return prisma.businessSetup.findUnique({
    where: { id: setupId },
    include: setupDetailInclude,
  });
}

async function loadRules(): Promise<RegulatoryRuleRecord[]> {
  const rulesRaw = await prisma.regulatoryRule.findMany({ orderBy: { sortOrder: "asc" } });
  return rulesRaw.map((r) => ({
    code: r.code,
    title: r.title,
    authority: r.authority,
    category: r.category,
    sortOrder: r.sortOrder,
    appliesWhen: r.appliesWhen as RegulatoryRuleRecord["appliesWhen"],
  }));
}

/** Advisor: generate checklist from rules engine for this inquiry. */
export async function generateChecklistForSetup(setupId: string, replace = false) {
  const setup = await getBusinessSetupForAdvisor(setupId);
  if (!setup) throw new Error("NOT_FOUND");

  if (replace) {
    await prisma.complianceTask.deleteMany({ where: { setupId } });
  } else {
    const existing = await prisma.complianceTask.count({ where: { setupId } });
    if (existing > 0) throw new Error("CHECKLIST_EXISTS");
  }

  const engineInput = buildEngineInputFromSetup(setup);
  const rules = await loadRules();
  const ieeLevel = resolveScreeningLevel(setup.classification?.ieeEiaLevel ?? "NONE");
  const checklist = generateChecklist(rules, engineInput, screeningLevelRequiresStudy(ieeLevel));

  if (checklist.length > 0) {
    await prisma.complianceTask.createMany({
      data: checklist.map((task) => ({
        setupId,
        code: task.code,
        title: task.title,
        authority: task.authority,
        status: "PENDING" as const,
      })),
    });
  }

  if (setup.status === "INTAKE") {
    await prisma.businessSetup.update({
      where: { id: setupId },
      data: { status: "RULES_GENERATED" },
    });
  }

  return prisma.complianceTask.findMany({
    where: { setupId },
    orderBy: { createdAt: "asc" },
  });
}

/** Advisor: add selected library rules as tasks. */
export async function addLibraryTasks(setupId: string, codes: string[]) {
  const setup = await getBusinessSetupForAdvisor(setupId);
  if (!setup) throw new Error("NOT_FOUND");

  const rules = await prisma.regulatoryRule.findMany({
    where: { code: { in: codes } },
  });
  const existing = await prisma.complianceTask.findMany({
    where: { setupId },
    select: { code: true },
  });
  const have = new Set(existing.map((t) => t.code));
  const toAdd = rules.filter((r) => !have.has(r.code));

  if (toAdd.length > 0) {
    await prisma.complianceTask.createMany({
      data: toAdd.map((r) => ({
        setupId,
        code: r.code,
        title: r.title,
        authority: r.authority,
        status: "PENDING" as const,
      })),
    });
  }

  if (setup.status === "INTAKE") {
    await prisma.businessSetup.update({
      where: { id: setupId },
      data: { status: "RULES_GENERATED" },
    });
  }

  return prisma.complianceTask.findMany({
    where: { setupId },
    orderBy: { createdAt: "asc" },
  });
}

/** Advisor: add a free-form checklist item. */
export async function addCustomTask(
  setupId: string,
  input: { title: string; authority: string; notes?: string }
) {
  const setup = await getBusinessSetupForAdvisor(setupId);
  if (!setup) throw new Error("NOT_FOUND");

  const code = `CUSTOM-${Date.now().toString(36).toUpperCase()}`;
  const task = await prisma.complianceTask.create({
    data: {
      setupId,
      code,
      title: input.title.trim(),
      authority: input.authority.trim() || "SARA Advisors",
      notes: input.notes?.trim() || null,
      status: "PENDING",
    },
  });

  if (setup.status === "INTAKE") {
    await prisma.businessSetup.update({
      where: { id: setupId },
      data: { status: "RULES_GENERATED" },
    });
  }

  return task;
}

export async function deleteComplianceTask(setupId: string, taskId: string) {
  const task = await prisma.complianceTask.findFirst({ where: { id: taskId, setupId } });
  if (!task) throw new Error("NOT_FOUND");
  await prisma.complianceTask.delete({ where: { id: taskId } });
}
