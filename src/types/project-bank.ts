import type {
  CapexRange,
  DealDeskStatus,
  FundingStage,
  InvestmentTimeframe,
  InvestorType,
  ProjectSector,
  ProjectStatus,
} from "@/generated/prisma";

export const PROJECT_SECTOR_LABELS: Record<ProjectSector, string> = {
  HEALTHCARE: "Healthcare",
  EDUCATION: "Education",
  HYDROPOWER: "Hydropower",
  RENEWABLE_ENERGY: "Renewable Energy",
  AGRI_TECH: "Agriculture & Agri-Tech",
  FOOD_FMCG: "Food & FMCG",
  FORESTRY: "Forestry & Environment",
  TOURISM: "Tourism & Hospitality",
  REAL_ESTATE: "Real Estate",
  CONSTRUCTION: "Construction",
  INFRASTRUCTURE: "Infrastructure",
  LOGISTICS: "Logistics & Transport",
  MANUFACTURING: "Manufacturing",
  MINING_MINERALS: "Mining & Minerals",
  ICT: "ICT & Digital",
  FINTECH: "Fintech & Financial Services",
  TELECOM: "Telecom",
  RETAIL: "Retail & E-commerce",
  MEDIA_CREATIVE: "Media & Creative",
  WATER_SANITATION: "Water & Sanitation",
  WASTE_CIRCULAR: "Waste & Circular Economy",
  SOCIAL_IMPACT: "Social Impact",
  OTHER: "Other",
};

export const PROJECT_SECTOR_OPTIONS = (Object.entries(PROJECT_SECTOR_LABELS) as [ProjectSector, string][]).map(
  ([value, label]) => ({ value, label })
);

export const PROJECT_SECTOR_VALUES = Object.keys(PROJECT_SECTOR_LABELS) as [
  ProjectSector,
  ...ProjectSector[],
];

export const CAPEX_RANGE_LABELS: Record<CapexRange, string> = {
  K50_100: "$50K–$100K",
  K100_250: "$100K–$250K",
  K250_500: "$250K–$500K",
  K500_1M: "$500K–$1M",
  M1_2_5: "$1M–$2.5M",
  M2_5_5: "$2.5M–$5M",
  M5_PLUS: "$5M+",
};

export const CAPEX_RANGE_OPTIONS = Object.entries(CAPEX_RANGE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const FUNDING_STAGE_LABELS: Record<FundingStage, string> = {
  PRE_SEED: "Pre-Seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  EXPANSION: "Expansion Capital",
  JOINT_VENTURE: "Joint Venture",
};

export const FUNDING_STAGE_OPTIONS = Object.entries(FUNDING_STAGE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const DEAL_DESK_STATUS_LABELS: Record<DealDeskStatus, string> = {
  NEW: "New",
  UNDER_VETTING: "Under vetting",
  NDA_SENT: "NDA sent",
  NDA_SIGNED: "NDA signed",
  DOSSIER_RELEASED: "Dossier released",
  REJECTED: "Rejected",
};

export const DEAL_DESK_STATUS_OPTIONS = (Object.keys(DEAL_DESK_STATUS_LABELS) as DealDeskStatus[]).map(
  (value) => ({ value, label: DEAL_DESK_STATUS_LABELS[value] })
);

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  INDIVIDUAL_ANGEL: "Individual Angel",
  VC_FUND: "VC Fund",
  PE_FIRM: "PE Firm",
  FAMILY_OFFICE: "Family Office",
  CORPORATE: "Corporate",
};

export const INVESTOR_TYPE_OPTIONS = Object.entries(INVESTOR_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const INVESTMENT_TIMEFRAME_LABELS: Record<InvestmentTimeframe, string> = {
  IMMEDIATELY: "Immediately",
  ONE_TO_THREE_MONTHS: "1–3 Months",
  THREE_TO_SIX_MONTHS: "3–6 Months",
  EXPLORING: "Exploring",
};

export const INVESTMENT_TIMEFRAME_OPTIONS = Object.entries(INVESTMENT_TIMEFRAME_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export type UseOfFundsItem = { category: string; percentage: number };

export function parseUseOfFunds(value: unknown): UseOfFundsItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const category = "category" in row ? String(row.category).trim() : "";
      const percentage = "percentage" in row ? Number(row.percentage) : NaN;
      if (!category || !Number.isFinite(percentage)) return null;
      return { category, percentage };
    })
    .filter((row): row is UseOfFundsItem => row !== null);
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sectorLabel(sector: string) {
  return PROJECT_SECTOR_LABELS[sector as ProjectSector] ?? sector.replace(/_/g, " ");
}

export function stageLabel(stage: string) {
  return FUNDING_STAGE_LABELS[stage as FundingStage] ?? stage.replace(/_/g, " ");
}

export function capexLabel(range: string) {
  return CAPEX_RANGE_LABELS[range as CapexRange] ?? range.replace(/_/g, " ");
}

export function irrLabel(value: string) {
  const raw = value.trim();
  if (!raw) return raw;
  if (raw.includes("%")) return raw;
  return `${raw}%`;
}
