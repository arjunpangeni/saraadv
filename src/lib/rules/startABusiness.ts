export type BusinessObjective = "MANUFACTURING" | "TRADING" | "SERVICE";
export type BusinessType = "PRIVATE_LIMITED" | "PUBLIC_LIMITED" | "PROPRIETORSHIP" | "PARTNERSHIP";
export type IndustrySizeCategory = "MICRO" | "COTTAGE" | "SMALL" | "MEDIUM" | "LARGE";
export type IndustryObjectiveCategory =
  | "ENERGY"
  | "MANUFACTURING"
  | "AGRICULTURE_FOREST"
  | "MINERAL"
  | "INFRASTRUCTURE"
  | "TOURISM"
  | "ICT"
  | "SERVICE"
  | "TRADING";

/**
 * "Start a Business" compliance rules engine.
 *
 * Turns minimal investor intake (SARA Advisors - start a business module.pdf,
 * sections A-I) into: (1) a generated registration/compliance checklist,
 * (2) hard-stop eligibility warnings (FDI negative list, shareholder limits,
 * min capital), and (3) an IEE/EIA screening level lookup.
 *
 * Seed reference data lives in prisma/data/*.json and is loaded into
 * RegulatoryRule / IeeEiaCriterion / FdiNegativeListItem at `prisma db seed`.
 */

export interface StartABusinessInput {
  objective: BusinessObjective;
  businessType: BusinessType;
  fdiRequested: boolean;
  sectorTags: string[]; // free-form tags e.g. ["food_beverage", "pharma", "import_export"]
  shareholders: { category: string; promoterCount: number; committedCapital: number }[];
  investment: { equityInvestment: number; loanInvestment: number };
  sizeCategory?: IndustrySizeCategory;
  objectiveCategory?: IndustryObjectiveCategory;
  licenseRequired?: boolean;
  fdiNegativeCodes?: string[];
}

export interface EligibilityIssue {
  severity: "BLOCKER" | "WARNING";
  code: string;
  message: string;
}

export interface RegulatoryRuleRecord {
  code: string;
  title: string;
  authority: string;
  category: string;
  sortOrder: number;
  appliesWhen: {
    always?: boolean;
    optional?: boolean;
    fdiRequested?: boolean;
    businessTypeIn?: string[];
    businessTypeNotIn?: string[];
    objectiveIn?: string[];
    objectiveNotIn?: string[];
    sectorSpecific?: string;
    ieeEiaRequired?: boolean;
  };
}

export const FDI_NEGATIVE_LIST: { code: string; description: string }[] = [
  { code: "FDI-A", description: "Poultry farming, fisheries, bee-keeping, fruits, vegetables, oil seeds, pulse seeds, milk industry and other sectors of primary agro-production" },
  { code: "FDI-B", description: "Cottage and small industries" },
  { code: "FDI-C", description: "Personal service business (hair cutting, tailoring, driving etc.)" },
  { code: "FDI-D", description: "Industries manufacturing arms, ammunition, bullets and shell, gunpowder or explosives, and nuclear, biological and chemical (N.B.C.) weapons; industries producing atomic energy and radio-active materials" },
  { code: "FDI-E", description: "Real estate business (excluding construction industries), retail business, internal courier service, local catering service, moneychanger, remittance service" },
  { code: "FDI-F", description: "Travel agency, guide involved in tourism, trekking and mountaineering guide, rural tourism including homestay" },
  { code: "FDI-G", description: "Business of mass communication media (newspaper, radio, television and online news) and motion picture of national language" },
  { code: "FDI-H", description: "Management, account, engineering, legal consultancy service and language training, music training, computer training" },
  { code: "FDI-I", description: "Consultancy services having foreign investment of more than fifty-one percent" },
];

const LICENSE_NEEDED_INDUSTRIES = [
  "Industries producing arms, ammunition, gunpowder or explosives",
  "Security printing (currency and coin production)",
  "Cigarette, tobacco and e-cigarette manufacturing",
  "Microbreweries and alcohol/beer production",
  "Stone, gravel, sand mining and processing",
  "Radio communication equipment production",
  "Precious minerals and petroleum product mining",
  "LPG refilling",
  "Drone manufacturing / drone services",
  "Other industries requiring permission under prevailing law",
];

export function checkFdiNegativeList(
  input: StartABusinessInput,
  negativeList: { code: string; description: string }[]
): EligibilityIssue[] {
  if (!input.fdiRequested) return [];
  const issues: EligibilityIssue[] = [];
  const selected = new Set(input.fdiNegativeCodes ?? []);

  const sizeBlocksFdi =
    Boolean(input.sizeCategory) && ["MICRO", "COTTAGE", "SMALL"].includes(input.sizeCategory!);

  for (const item of negativeList) {
    if (item.code === "FDI-B" && sizeBlocksFdi) continue;
    if (selected.has(item.code)) {
      issues.push({
        severity: "BLOCKER",
        code: item.code,
        message: `This activity is on Nepal’s FDI Negative List: ${item.description}`,
      });
    }
  }

  if (sizeBlocksFdi) {
    issues.push({
      severity: "BLOCKER",
      code: "FDI-B",
      message:
        "Cottage, micro, and small industries are on the FDI Negative List. FDI is not permitted at this industry size.",
    });
  }

  return issues;
}

export function checkShareholderConditions(input: StartABusinessInput): EligibilityIssue[] {
  const issues: EligibilityIssue[] = [];
  const totalShareholders = input.shareholders.reduce((sum, s) => sum + s.promoterCount, 0);
  const hasForeign = input.shareholders.some((s) =>
    ["FOREIGN_CITIZEN", "FOREIGN_ENTITY"].includes(s.category)
  );
  const hasPublic = input.shareholders.some((s) => s.category === "PUBLIC");

  switch (input.businessType) {
    case "PRIVATE_LIMITED":
      if (totalShareholders > 100) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PVT-MAX",
          message: "Private Limited companies may have a maximum of 100 shareholders.",
        });
      }
      break;
    case "PUBLIC_LIMITED":
      if (totalShareholders < 7) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PUB-MIN",
          message: "Public Limited companies require a minimum of 7 shareholders.",
        });
      }
      break;
    case "PROPRIETORSHIP":
      if (totalShareholders > 1) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PROP-MAX",
          message: "Proprietorships may have only 1 owner.",
        });
      }
      if (input.shareholders.some((s) => s.promoterCount > 0 && s.category !== "NEPALI_CITIZEN")) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PROP-NEPALI-ONLY",
          message: "Proprietorships may only have a Nepali citizen as owner.",
        });
      }
      if (hasForeign) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PROP-FOREIGN",
          message: "Proprietorships cannot have foreign parties.",
        });
      }
      if (hasPublic) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PROP-PUBLIC",
          message: "Proprietorships cannot raise capital from the general public / secondary market.",
        });
      }
      break;
    case "PARTNERSHIP":
      if (totalShareholders < 2) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PARTNERSHIP-MIN",
          message: "Partnerships require a minimum of 2 partners.",
        });
      }
      if (hasForeign) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PARTNERSHIP-FOREIGN",
          message: "Partnerships cannot have foreign parties.",
        });
      }
      if (hasPublic) {
        issues.push({
          severity: "BLOCKER",
          code: "SHAREHOLDER-PARTNERSHIP-PUBLIC",
          message: "Partnerships cannot raise capital from the general public / secondary market.",
        });
      }
      break;
  }

  return issues;
}

const MIN_FDI_CAPITAL_NPR = 20_000_000; // 2 crore

export function checkFdiCapitalRequirement(input: StartABusinessInput): EligibilityIssue[] {
  if (!input.fdiRequested) return [];
  const issues: EligibilityIssue[] = [];

  if (["PROPRIETORSHIP", "PARTNERSHIP"].includes(input.businessType)) {
    issues.push({
      severity: "BLOCKER",
      code: "FDI-NOT-ALLOWED-BUSINESS-TYPE",
      message: "FDI is not permitted for Proprietorship or Partnership entities.",
    });
  }
  if (input.objective === "TRADING") {
    issues.push({
      severity: "BLOCKER",
      code: "FDI-NOT-ALLOWED-TRADING",
      message: "FDI is not permitted for businesses whose objective is Trading.",
    });
  }

  const totalCapital = input.investment.equityInvestment + input.investment.loanInvestment;
  if (totalCapital < MIN_FDI_CAPITAL_NPR) {
    issues.push({
      severity: "BLOCKER",
      code: "FDI-MIN-CAPITAL",
      message: `FDI requires a minimum investment of Rs 2 crore (20,000,000). Proposed total capital is below this threshold.`,
    });
  }

  return issues;
}

export function checkInvestmentTotals(
  investment: {
    equityInvestment: number;
    loanInvestment: number;
    fixedAssets: number;
    plantMachineryCost: number;
    netCurrentAssets: number;
  },
  objective: BusinessObjective
): EligibilityIssue[] {
  const issues: EligibilityIssue[] = [];
  const totalCapital = investment.equityInvestment + investment.loanInvestment;
  const assetTotal =
    investment.fixedAssets + investment.plantMachineryCost + investment.netCurrentAssets;

  if (assetTotal > 0 && Math.abs(totalCapital - assetTotal) > 1) {
    issues.push({
      severity: "WARNING",
      code: "INVESTMENT-TOTAL-MISMATCH",
      message:
        "Proposed capital (equity + loan) should equal fixed assets + plant & machinery + net current assets.",
    });
  }

  if (objective === "MANUFACTURING" && assetTotal <= 0 && totalCapital <= 0) {
    issues.push({
      severity: "BLOCKER",
      code: "INVESTMENT-MFG-REQUIRED",
      message: "Manufacturing ventures require equity/loan capital and an asset breakdown.",
    });
  }

  return issues;
}

export function resolveScreeningLevel(
  level: string | null | undefined
): "NONE" | "BRIEF" | "IEE" | "EIA" {
  if (!level || level === "NONE") return "NONE";
  if (level === "BRIEF" || level === "IEE" || level === "EIA") return level;
  return "NONE";
}

export function screeningLevelRequiresStudy(level: string | null | undefined): boolean {
  return resolveScreeningLevel(level) !== "NONE";
}

export function evaluateEligibility(
  input: StartABusinessInput,
  negativeList: { code: string; description: string }[],
  investmentDetails?: {
    equityInvestment: number;
    loanInvestment: number;
    fixedAssets: number;
    plantMachineryCost: number;
    netCurrentAssets: number;
  }
): EligibilityIssue[] {
  const base = [
    ...checkFdiNegativeList(input, negativeList),
    ...checkShareholderConditions(input),
    ...checkFdiCapitalRequirement(input),
  ];
  if (investmentDetails) {
    base.push(...checkInvestmentTotals(investmentDetails, input.objective));
  }
  const seen = new Set<string>();
  return base.filter((issue) => {
    if (seen.has(issue.code)) return false;
    seen.add(issue.code);
    return true;
  });
}

function ruleApplies(rule: RegulatoryRuleRecord, input: StartABusinessInput): boolean {
  const w = rule.appliesWhen;
  if (w.always) return true;
  if (w.optional) return true; // surfaced as an optional/recommended checklist item

  let applies = true;
  if (typeof w.fdiRequested === "boolean") applies = applies && input.fdiRequested === w.fdiRequested;
  if (w.businessTypeIn) applies = applies && w.businessTypeIn.includes(input.businessType);
  if (w.businessTypeNotIn) applies = applies && !w.businessTypeNotIn.includes(input.businessType);
  if (w.objectiveIn) applies = applies && w.objectiveIn.includes(input.objective);
  if (w.objectiveNotIn) applies = applies && !w.objectiveNotIn.includes(input.objective);
  if (w.sectorSpecific) applies = applies && input.sectorTags.includes(w.sectorSpecific);
  if (typeof w.ieeEiaRequired === "boolean") {
    // Resolved by the caller via IEE/EIA lookup before invoking the engine when relevant.
    applies = applies && w.ieeEiaRequired;
  }
  return applies;
}

export interface GeneratedTask {
  code: string;
  title: string;
  authority: string;
  category: string;
  optional: boolean;
}

export function generateChecklist(
  rules: RegulatoryRuleRecord[],
  input: StartABusinessInput,
  ieeEiaRequired: boolean
): GeneratedTask[] {
  const tasks = rules
    .map((rule) => {
      const effectiveRule: RegulatoryRuleRecord = rule.appliesWhen.ieeEiaRequired
        ? { ...rule, appliesWhen: { ...rule.appliesWhen, ieeEiaRequired } }
        : rule;
      return { rule: effectiveRule, applies: ruleApplies(effectiveRule, input) };
    })
    .filter((r) => r.applies)
    .sort((a, b) => a.rule.sortOrder - b.rule.sortOrder)
    .map(({ rule }) => ({
      code: rule.code,
      title: rule.title,
      authority: rule.authority,
      category: rule.category,
      optional: Boolean(rule.appliesWhen.optional),
    }));

  if (input.licenseRequired) {
    tasks.push({
      code: "REG-LICENSE",
      title: "Obtain industry-specific operating license / DOI permission",
      authority: "DOI",
      category: "SECTOR_LICENSE",
      optional: false,
    });
  }

  return tasks;
}

export { LICENSE_NEEDED_INDUSTRIES, MIN_FDI_CAPITAL_NPR };
