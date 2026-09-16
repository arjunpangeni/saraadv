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
 * Turns minimal investor intake (ASAR Partners - start a business module.pdf,
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
    Boolean(input.sizeCategory) && ["MICRO", "COTTAGE"].includes(input.sizeCategory!);

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
        "Cottage and micro industries are on the FDI Negative List. FDI is not permitted at this industry size.",
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

const MIN_FDI_CAPITAL_NPR = 20_000_000; // 2 crore — general FITTA floor
/** Sector tags / objective categories treated as IT for the FDI minimum exemption. */
export const FDI_IT_EXEMPT_SECTOR_TAGS = ["telecom_it"] as const;

/**
 * Nepal allows FDI below the general Rs 2 crore minimum for IT / ICT industries.
 * Other sectors still need at least NPR 20,000,000.
 */
export function isFdiItMinimumExempt(input: Pick<StartABusinessInput, "sectorTags" | "objectiveCategory">): boolean {
  if (input.objectiveCategory === "ICT") return true;
  return input.sectorTags.some((tag) =>
    (FDI_IT_EXEMPT_SECTOR_TAGS as readonly string[]).includes(tag)
  );
}

export function minFdiCapitalNpr(input: Pick<StartABusinessInput, "sectorTags" | "objectiveCategory">): number {
  return isFdiItMinimumExempt(input) ? 0 : MIN_FDI_CAPITAL_NPR;
}

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
  const minCapital = minFdiCapitalNpr(input);
  if (minCapital > 0 && totalCapital < minCapital) {
    issues.push({
      severity: "BLOCKER",
      code: "FDI-MIN-CAPITAL",
      message: `FDI requires a minimum investment of Rs 2 crore (20,000,000), except for IT / ICT industries. Proposed total capital is below this threshold.`,
    });
  }

  return issues;
}

export const MICRO_FIXED_CAPITAL_MAX = 2_000_000;
export const MICRO_TURNOVER_MAX = 1_000_000;
export const MICRO_WORKERS_MAX = 9;
export const MICRO_POWER_KW_MAX = 20;
export const COTTAGE_POWER_KW_MAX = 50;
export const SMALL_FIXED_CAPITAL_MAX = 150_000_000;
export const MEDIUM_FIXED_CAPITAL_MAX = 500_000_000;

export const COTTAGE_ACTIVITIES = [
  "Hand/foot-operated or semi-automatic looms — weaving, dyeing, printing, sewing (excluding ready-made garments)",
  "Hand-woven rugs, carpets, pashmina, clothing, handmade paper, silk-based items (wool/silk-based)",
  "Traditional art objects and traditional sculpture",
  "Handcrafted metal utensils/handicrafts (copper, brass, iron, bronze, German silver)",
  "Traditional handmade tools for household use (knives, khukuri, sickles, axes, spades, stoves)",
  "Handmade gold/silver jewelry and ornaments (including precious/semi-precious stones)",
  "Handmade items from local stone; rural tanning / leather work",
  "Products from natural fibers (jute, sawi grass, chamois, babio, cotton yarn, allo, etc.)",
  "Stone carving",
  "Pouva / Thangka paintings and other traditional paintings",
  "Traditional masks, dolls, and toys",
  "Traditional handicrafts, musical instruments, and traditional art objects",
  "Artistic objects from wood, bone/horn, clay, rock/minerals, ceramics, earthenware",
  "Hand-printed brick industry",
] as const;

export const INDUSTRY_SIZE_GUIDE: Record<
  IndustrySizeCategory,
  {
    letter: string;
    label: string;
    threshold: string;
    capital: string;
    fdiAllowed: boolean;
    ieeTypical: boolean;
    rules: string[];
  }
> = {
  MICRO: {
    letter: "A",
    label: "Micro Enterprise",
    threshold: "Must meet every Micro test",
    capital: "Fixed capital ≤ NPR 2 million (excluding land)",
    fdiAllowed: false,
    ieeTypical: false,
    rules: [
      "Fixed capital up to NPR 2 million, excluding real estate / land value",
      "The entrepreneur personally operates and manages the business",
      "Maximum of 9 workers, including the entrepreneur",
      "Annual turnover less than NPR 1 million",
      "If machinery is used, electricity or fuel consumption of 20 kW or less",
    ],
  },
  COTTAGE: {
    letter: "B",
    label: "Cottage Industry",
    threshold: "Traditional / artisan exception — not only a capital band",
    capital: "Small-scale; must match the artisan list (not just capital)",
    fdiAllowed: false,
    ieeTypical: false,
    rules: [
      "Based on traditional skills and technology",
      "Labor-intensive, using specific skills, local raw materials, local technology, art, and culture",
      "If machinery is used, maximum 50 kW of electrical capacity",
      "The activity must be on the official cottage / artisan list",
      "If it is not on that list, classify as Micro or Small by capital, workers, and turnover instead",
    ],
  },
  SMALL: {
    letter: "C",
    label: "Small Industry",
    threshold: "Not Micro or Cottage, capital up to NPR 15 crore",
    capital: "Fixed capital up to NPR 15 crore (150 million)",
    fdiAllowed: true,
    ieeTypical: true,
    rules: [
      "Any industry that is not Micro or Cottage",
      "Fixed capital up to NPR 15 crore (150 million)",
      "FDI is permitted if other FDI rules also pass",
      "IEE / EIA is decided by the environment sheet (sector + scale), not by size alone",
    ],
  },
  MEDIUM: {
    letter: "D",
    label: "Medium Industry",
    threshold: "Fixed capital above NPR 15 crore up to NPR 50 crore",
    capital: "More than NPR 15 crore up to NPR 50 crore",
    fdiAllowed: true,
    ieeTypical: true,
    rules: [
      "Fixed capital more than NPR 15 crore and up to NPR 50 crore (500 million)",
      "FDI is permitted if other FDI rules also pass",
      "IEE / EIA is decided by the environment sheet (sector + scale)",
    ],
  },
  LARGE: {
    letter: "E",
    label: "Large Industry",
    threshold: "Fixed capital above NPR 50 crore",
    capital: "More than NPR 50 crore",
    fdiAllowed: true,
    ieeTypical: true,
    rules: [
      "Fixed capital more than NPR 50 crore",
      "FDI is permitted if other FDI rules also pass",
      "IEE / EIA is decided by the environment sheet (sector + scale)",
    ],
  },
};

/** Fixed capital for size classification: assets excl. land/real estate + plant & machinery. */
export function fixedCapitalNpr(investment: {
  fixedAssets: number;
  plantMachineryCost: number;
}): number {
  return Math.max(0, investment.fixedAssets) + Math.max(0, investment.plantMachineryCost);
}

export function capitalSizeBracket(
  fixedCapital: number
): Exclude<IndustrySizeCategory, "COTTAGE"> | null {
  if (fixedCapital <= 0) return null;
  if (fixedCapital <= MICRO_FIXED_CAPITAL_MAX) return "MICRO";
  if (fixedCapital <= SMALL_FIXED_CAPITAL_MAX) return "SMALL";
  if (fixedCapital <= MEDIUM_FIXED_CAPITAL_MAX) return "MEDIUM";
  return "LARGE";
}

export interface IndustrySizeFacts {
  sizeCategory: IndustrySizeCategory;
  fixedAssets: number;
  plantMachineryCost: number;
  ownerOperated: boolean;
  workerCount: number;
  annualTurnover: number;
  powerKw: number;
  cottageActivityConfirmed: boolean;
}

export interface IndustrySizeCheck {
  id: string;
  label: string;
  done: boolean;
}

export function industrySizeChecklist(
  facts: IndustrySizeFacts,
  extras?: { fdiRequested?: boolean }
): IndustrySizeCheck[] {
  const capital = fixedCapitalNpr(facts);
  const items: IndustrySizeCheck[] = [];

  if (facts.sizeCategory === "MICRO") {
    items.push(
      {
        id: "SIZE-MICRO-CAPITAL",
        label: "Fixed capital is at most NPR 2 million (excluding land)",
        done: capital <= MICRO_FIXED_CAPITAL_MAX,
      },
      {
        id: "SIZE-MICRO-OWNER",
        label: "Owner-operated and managed by the entrepreneur",
        done: facts.ownerOperated,
      },
      {
        id: "SIZE-MICRO-WORKERS",
        label: "Workers including entrepreneur are between 1 and 9",
        done: Number.isFinite(facts.workerCount) && facts.workerCount >= 1 && facts.workerCount <= MICRO_WORKERS_MAX,
      },
      {
        id: "SIZE-MICRO-TURNOVER",
        label: "Annual turnover is greater than 0 and less than NPR 1 million",
        done:
          Number.isFinite(facts.annualTurnover) &&
          facts.annualTurnover > 0 &&
          facts.annualTurnover < MICRO_TURNOVER_MAX,
      },
      {
        id: "SIZE-MICRO-POWER",
        label: "Power use is 20 kW or less if machinery is used",
        done: Number.isFinite(facts.powerKw) && facts.powerKw <= MICRO_POWER_KW_MAX,
      }
    );
  }

  if (facts.sizeCategory === "COTTAGE") {
    items.push(
      {
        id: "SIZE-COTTAGE-ACTIVITY",
        label: "Activity is on the cottage / artisan list",
        done: facts.cottageActivityConfirmed,
      },
      {
        id: "SIZE-COTTAGE-POWER",
        label: "Power use is 50 kW or less if machinery is used",
        done: Number.isFinite(facts.powerKw) && facts.powerKw <= COTTAGE_POWER_KW_MAX,
      },
      {
        id: "SIZE-COTTAGE-CAPITAL",
        label: "Fixed capital is not in the Medium or Large bracket",
        done: capital <= SMALL_FIXED_CAPITAL_MAX,
      }
    );
  }

  if (facts.sizeCategory === "SMALL") {
    items.push({
      id: "SIZE-SMALL-CAPITAL",
      label: "Fixed capital is at most NPR 15 crore",
      done: capital <= SMALL_FIXED_CAPITAL_MAX,
    });
  }

  if (facts.sizeCategory === "MEDIUM") {
    items.push({
      id: "SIZE-MEDIUM-CAPITAL",
      label: "Fixed capital is more than NPR 15 crore and up to NPR 50 crore",
      done: capital > SMALL_FIXED_CAPITAL_MAX && capital <= MEDIUM_FIXED_CAPITAL_MAX,
    });
  }

  if (facts.sizeCategory === "LARGE") {
    items.push({
      id: "SIZE-LARGE-CAPITAL",
      label: "Fixed capital is more than NPR 50 crore",
      done: capital > MEDIUM_FIXED_CAPITAL_MAX,
    });
  }

  if (extras?.fdiRequested && ["MICRO", "COTTAGE"].includes(facts.sizeCategory)) {
    items.push({
      id: "FDI-B",
      label: "FDI is off, or size is Small, Medium, or Large",
      done: false,
    });
  }

  return items;
}

export function checkIndustrySizeClassification(facts: IndustrySizeFacts): EligibilityIssue[] {
  const issues: EligibilityIssue[] = [];
  const capital = fixedCapitalNpr(facts);
  const bracket = capitalSizeBracket(capital);

  if (facts.sizeCategory === "MICRO") {
    if (capital > MICRO_FIXED_CAPITAL_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-MICRO-CAPITAL",
        message: `Micro enterprises must have fixed capital of at most NPR 2 million (excluding land). Proposed fixed capital is above this limit.`,
      });
    }
    if (!facts.ownerOperated) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-MICRO-OWNER",
        message: "A Micro enterprise must be personally operated and managed by the entrepreneur.",
      });
    }
    if (!Number.isFinite(facts.workerCount) || facts.workerCount < 1 || facts.workerCount > MICRO_WORKERS_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-MICRO-WORKERS",
        message: "A Micro enterprise may have at most 9 workers, including the entrepreneur.",
      });
    }
    if (!Number.isFinite(facts.annualTurnover) || facts.annualTurnover <= 0 || facts.annualTurnover >= MICRO_TURNOVER_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-MICRO-TURNOVER",
        message: "A Micro enterprise must have annual turnover of less than NPR 1 million.",
      });
    }
    if (facts.powerKw > MICRO_POWER_KW_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-MICRO-POWER",
        message: "If machinery is used, a Micro enterprise may use at most 20 kW of electricity or fuel.",
      });
    }
  }

  if (facts.sizeCategory === "COTTAGE") {
    if (!facts.cottageActivityConfirmed) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-COTTAGE-ACTIVITY",
        message:
          "Cottage industry is not a capital bracket. Confirm the activity is on the traditional / artisan list.",
      });
    }
    if (facts.powerKw > COTTAGE_POWER_KW_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-COTTAGE-POWER",
        message: "If machinery is used, a Cottage industry may use at most 50 kW of electrical capacity.",
      });
    }
    if (capital > SMALL_FIXED_CAPITAL_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-COTTAGE-CAPITAL",
        message:
          "Cottage industries are small-scale. Proposed fixed capital is in the Medium or Large bracket.",
      });
    }
  }

  if (facts.sizeCategory === "SMALL") {
    if (capital > SMALL_FIXED_CAPITAL_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-SMALL-CAPITAL",
        message: "Small industries must have fixed capital of at most NPR 15 crore. Choose Medium or Large.",
      });
    }
  }

  if (facts.sizeCategory === "MEDIUM") {
    if (capital <= SMALL_FIXED_CAPITAL_MAX || capital > MEDIUM_FIXED_CAPITAL_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-MEDIUM-CAPITAL",
        message:
          bracket && bracket !== "MEDIUM"
            ? `Medium industries need fixed capital above NPR 15 crore and up to NPR 50 crore. Proposed fixed capital falls in the ${bracket.toLowerCase()} bracket.`
            : "Medium industries need fixed capital above NPR 15 crore and up to NPR 50 crore. Enter proposed fixed assets and plant & machinery that match this range.",
      });
    }
  }

  if (facts.sizeCategory === "LARGE") {
    if (capital <= MEDIUM_FIXED_CAPITAL_MAX) {
      issues.push({
        severity: "BLOCKER",
        code: "SIZE-LARGE-CAPITAL",
        message:
          bracket && bracket !== "LARGE"
            ? `Large industries need fixed capital above NPR 50 crore. Proposed fixed capital falls in the ${bracket.toLowerCase()} bracket.`
            : "Large industries need fixed capital above NPR 50 crore. Enter proposed fixed assets and plant & machinery that match this range.",
      });
    }
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

  if ((totalCapital > 0 || assetTotal > 0) && Math.abs(totalCapital - assetTotal) > 1) {
    issues.push({
      severity: "BLOCKER",
      code: "INVESTMENT-TOTAL-MISMATCH",
      message:
        "Investment total (equity + loan) must equal proposed application (fixed assets + plant & machinery + net current assets).",
    });
  }

  if (objective === "MANUFACTURING" && totalCapital <= 0) {
    issues.push({
      severity: "BLOCKER",
      code: "INVESTMENT-MFG-REQUIRED",
      message: "Manufacturing ventures require equity and/or loan investment.",
    });
  }

  if (objective === "MANUFACTURING" && investment.plantMachineryCost <= 0) {
    issues.push({
      severity: "BLOCKER",
      code: "INVESTMENT-MFG-MACHINERY",
      message: "Manufacturing ventures must declare plant & machinery cost.",
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
