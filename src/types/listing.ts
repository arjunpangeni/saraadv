import { z } from "zod";
import { LINE_ITEM_KEYS } from "@/lib/calc";

/**
 * Zod schema for the full Seller Ingestion Wizard payload
 * (SARA_Advisors_BuySell_System_Blueprint - Modules A-F + enhancements).
 * Shared between the client wizard (live validation) and the
 * POST /api/listings route handler (server validation).
 */

export const INDUSTRY_OPTIONS = [
  "HYDROPOWER",
  "MANUFACTURING",
  "FMCG",
  "IT",
  "HOSPITALITY",
  "RETAIL",
  "HEALTHCARE",
  "CONSTRUCTION",
  "TELECOM",
  "AGRICULTURE",
  "OTHER",
] as const;

export const INDUSTRY_LABELS: Record<(typeof INDUSTRY_OPTIONS)[number], string> = {
  HYDROPOWER: "Hydropower",
  MANUFACTURING: "Manufacturing",
  FMCG: "FMCG",
  IT: "IT",
  HOSPITALITY: "Hospitality",
  RETAIL: "Retail",
  HEALTHCARE: "Healthcare",
  CONSTRUCTION: "Construction",
  TELECOM: "Telecom",
  AGRICULTURE: "Agriculture",
  OTHER: "Other",
};

export const LEGAL_STRUCTURE_OPTIONS = [
  "PRIVATE_LIMITED",
  "PUBLIC_LIMITED",
  "PARTNERSHIP",
  "PROPRIETORSHIP",
] as const;

export const MODALITY_OPTIONS = [
  "OUTRIGHT_ACQUISITION",
  "MAJORITY_EQUITY_TRANSFER",
  "STRATEGIC_JOINT_VENTURE",
  "ASSET_BLOCK_PURCHASE",
] as const;

export const EXIT_REASON_OPTIONS = [
  "EXECUTIVE_RETIREMENT",
  "CORPORATE_RELOCATION",
  "PARTNER_REALIGNMENT",
  "LIQUID_CAPITAL_REQUIREMENTS",
  "OTHER",
] as const;

export const LEGAL_STRUCTURE_LABELS: Record<(typeof LEGAL_STRUCTURE_OPTIONS)[number], string> = {
  PRIVATE_LIMITED: "Private Limited",
  PUBLIC_LIMITED: "Public Limited",
  PARTNERSHIP: "Partnership",
  PROPRIETORSHIP: "Proprietorship",
};

export const MODALITY_LABELS: Record<(typeof MODALITY_OPTIONS)[number], string> = {
  OUTRIGHT_ACQUISITION: "100% Outright Acquisition",
  MAJORITY_EQUITY_TRANSFER: "Majority Equity Transfer",
  STRATEGIC_JOINT_VENTURE: "Strategic Joint Venture",
  ASSET_BLOCK_PURCHASE: "Asset Block Purchase Only",
};

export const EXIT_REASON_LABELS: Record<(typeof EXIT_REASON_OPTIONS)[number], string> = {
  EXECUTIVE_RETIREMENT: "Executive Retirement",
  CORPORATE_RELOCATION: "Corporate Relocation",
  PARTNER_REALIGNMENT: "Partner Realignment",
  LIQUID_CAPITAL_REQUIREMENTS: "Liquid Capital Requirements",
  OTHER: "Other",
};

export const SCRUTINY_CTA_LABEL = "Request Full Profile & Get Quote for SARA M&A Services";
export const SCRUTINY_CTA_SHORT = "Request full profile & quote";

export function industryLabel(value?: string | null) {
  if (!value) return "—";
  return INDUSTRY_LABELS[value as keyof typeof INDUSTRY_LABELS] ?? value.replace(/_/g, " ");
}

export function legalStructureLabel(value?: string | null) {
  if (!value) return "—";
  return LEGAL_STRUCTURE_LABELS[value as keyof typeof LEGAL_STRUCTURE_LABELS] ?? value.replace(/_/g, " ");
}

export function modalityLabel(value?: string | null) {
  if (!value) return "—";
  return MODALITY_LABELS[value as keyof typeof MODALITY_LABELS] ?? value.replace(/_/g, " ");
}

export function exitReasonLabel(value?: string | null) {
  if (!value) return "—";
  return EXIT_REASON_LABELS[value as keyof typeof EXIT_REASON_LABELS] ?? value.replace(/_/g, " ");
}

export const COMPLIANCE_AUTHORITY_OPTIONS = [
  "OCR",
  "IRD",
  "SPECIALIZED_PERMITS",
  "IP_BLOCKS",
] as const;

export const COMPLIANCE_AUTHORITY_LABELS: Record<(typeof COMPLIANCE_AUTHORITY_OPTIONS)[number], string> = {
  OCR: "Office of Company Registrar",
  IRD: "Inland Revenue Department",
  SPECIALIZED_PERMITS: "Specialized Operational Permits",
  IP_BLOCKS: "Intellectual Property Blocks",
};

export const REVALUATION_ASSET_TYPES = [
  "LAND_BUILDINGS",
  "PLANT_MACHINERY",
  "INVENTORY",
  "INTANGIBLES",
] as const;

export const REVALUATION_ASSET_LABELS: Record<(typeof REVALUATION_ASSET_TYPES)[number], string> = {
  LAND_BUILDINGS: "Land & Buildings",
  PLANT_MACHINERY: "Plant & Machinery",
  INVENTORY: "Inventory Valuations",
  INTANGIBLES: "Intangible Value Assessment",
};

const locationSchema = z.object({
  province: z.string().min(1, "Select a province."),
  district: z.string().min(1, "Select a district."),
  localBody: z.string().min(1, "Select a local body."),
  ward: z.string().optional(),
});

const lineItemFields = Object.fromEntries(
  LINE_ITEM_KEYS.map((key) => [key, z.number()])
) as Record<(typeof LINE_ITEM_KEYS)[number], z.ZodNumber>;

export const annualFinancialSchema = z.object({
  fiscalYear: z.number().int().min(1).max(3),
  fiscalYearLabel: z.string().min(1),
  ...lineItemFields,
  revenueGrowthPct: z.number().optional(),
  netMarginPct: z.number().optional(),
  capex: z.number().min(0).optional(),
});

export const DEFAULT_COMPLIANCE_ROWS = COMPLIANCE_AUTHORITY_OPTIONS.map((authority) => ({
  authority,
  status: "PENDING" as const,
  identifier: "",
  lastClearanceYear: undefined as number | undefined,
  remarks: undefined as string | undefined,
}));

const assetRevaluationSchema = z.object({
  assetType: z.enum(REVALUATION_ASSET_TYPES),
  bookValue: z.number().min(0),
  marketValue: z.number().min(0),
  notes: z.string().optional(),
});

const complianceRecordSchema = z.object({
  authority: z.enum([
    "OCR",
    "IRD",
    "DOI",
    "DDA",
    "DFTQC",
    "NEA_DOED",
    "NRB",
    "SEBON",
    "SSF",
    "SPECIALIZED_PERMITS",
    "IP_BLOCKS",
    "OTHER",
  ]),
  status: z.enum(["COMPLIANT", "NON_COMPLIANT", "PENDING"]),
  identifier: z.string().optional(),
  lastClearanceYear: z.number().int().optional(),
  remarks: z.string().optional(),
  outstandingDisputes: z.string().optional(),
});

const ipAssetSchema = z.object({
  type: z.enum(["TRADEMARK", "PATENT", "COPYRIGHT"]),
  reference: z.string().min(1),
});

export const listingWizardSchema = z.object({
  companyName: z.string().trim().min(2, "Enter the legal company name."),
  industry: z.enum(INDUSTRY_OPTIONS, { error: "Select an industry." }),
  legalStructure: z.enum(LEGAL_STRUCTURE_OPTIONS, { error: "Select a legal structure." }),
  establishedYear: z
    .number({ error: "Select the year the company was established." })
    .int({ error: "Select the year the company was established." })
    .min(1900, { error: "Select a year from 1900 onwards." })
    .max(new Date().getFullYear(), { error: "Year cannot be in the future." }),
  operatingProvinces: z.array(z.string().min(1)).min(1, "Select at least one operating province."),
  headOffice: locationSchema,
  plantLocation: locationSchema.optional(),
  strategicAssumptions: z.string().optional(),

  financials: z.array(annualFinancialSchema).length(3, "3 years of historical financials are required."),
  projections: z.array(annualFinancialSchema).length(3, "3 years of projections are required."),

  assetRevaluations: z.array(assetRevaluationSchema).default([]),

  complianceRecords: z.array(complianceRecordSchema).default([]),
  ipAssets: z.array(ipAssetSchema).default([]),

  askingPriceNpr: z.number({ error: "Enter the asking price." }).min(0, "Enter a valid asking price."),
  modality: z.enum(MODALITY_OPTIONS, { error: "Select a transaction modality." }),
  exitReason: z.enum(EXIT_REASON_OPTIONS, { error: "Select a reason for exit." }),
  valuationJustification: z.string().trim().min(10, "Explain the asking price in at least 10 characters."),

  humanCapital: z.object({
    managementCount: z.number().int().min(0),
    technicalCount: z.number().int().min(0),
    generalCount: z.number().int().min(0),
    ssfCompliant: z.boolean(),
  }),
  riskLog: z.object({
    outstandingDebt: z.number().min(0),
    assetEncumbrances: z.string().optional(),
    bankCollateralTies: z.string().optional(),
    pendingLitigations: z.string().optional(),
  }),
  capacityMetric: z
    .object({
      runningOutput: z.number().min(0),
      installedPeak: z.number().min(0),
      capacityUnit: z.string().optional(),
    })
    .optional(),

  documentKeys: z
    .array(
      z.object({
        key: z.string(),
        type: z.enum(["REGULATORY_ATTACHMENT", "FINANCIAL_STATEMENT", "MOA_AOA", "OTHER"]),
        label: z.string().optional(),
      })
    )
    .optional(),
});

export type ListingWizardInput = z.infer<typeof listingWizardSchema>;

export const WIZARD_STEPS = [
  { key: "identification", label: "Company details", short: "Company" },
  { key: "financials", label: "Past 3 years", short: "Financials" },
  { key: "projections", label: "Next 3 years", short: "Forecast" },
  { key: "revaluation", label: "Asset values", short: "Assets", optional: true },
  { key: "compliance", label: "Licenses & IP", short: "Compliance", optional: true },
  { key: "deal", label: "Sale terms", short: "Deal" },
  { key: "enhancements", label: "Team & risk", short: "Team", optional: true },
  { key: "review", label: "Review & submit", short: "Review" },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];

const FIELD_LABELS: Record<string, string> = {
  companyName: "Company name",
  industry: "Industry",
  legalStructure: "Legal structure",
  establishedYear: "Established year",
  operatingProvinces: "Operating provinces",
  "headOffice.province": "Head office province",
  "headOffice.district": "Head office district",
  "headOffice.localBody": "Head office local body",
  "plantLocation.province": "Plant province",
  "plantLocation.district": "Plant district",
  "plantLocation.localBody": "Plant local body",
  askingPriceNpr: "Asking price",
  modality: "Transaction modality",
  exitReason: "Reason for exit",
  valuationJustification: "Valuation justification",
};

function humanizeZodMessage(message: string, key: string): string {
  if (message.startsWith("Invalid option:")) {
    if (key === "industry") return "Select an industry.";
    if (key === "legalStructure") return "Select a legal structure.";
    if (key === "modality") return "Select a transaction modality.";
    if (key === "exitReason") return "Select a reason for exit.";
    return "Please choose an option from the list.";
  }
  if (
    /expected number to be >=1900/i.test(message) ||
    (key === "establishedYear" && /Too small|expected number/i.test(message))
  ) {
    return "Select the year the company was established.";
  }
  if (/Invalid input: expected number/i.test(message) && key === "establishedYear") {
    return "Select the year the company was established.";
  }
  if (/Too small: expected string/i.test(message) || /Invalid input: expected string/i.test(message)) {
    return "This field is required.";
  }
  return message;
}

export function listingValidationErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!fields[key]) fields[key] = humanizeZodMessage(issue.message, key);
  }
  const summary = Object.entries(fields).map(([key, message]) => {
    const label = FIELD_LABELS[key] ?? key.replace(/\./g, " → ");
    return `${label}: ${message}`;
  });
  return { fields, summary };
}

export function listingStepForField(key: string): WizardStepKey {
  if (key.startsWith("financials")) return "financials";
  if (key.startsWith("projections") || key === "strategicAssumptions") return "projections";
  if (key.startsWith("assetRevaluations")) return "revaluation";
  if (key.startsWith("compliance") || key.startsWith("ipAssets")) return "compliance";
  if (key === "askingPriceNpr" || key === "modality" || key === "exitReason" || key === "valuationJustification") {
    return "deal";
  }
  if (key.startsWith("humanCapital") || key.startsWith("riskLog") || key.startsWith("capacity")) return "enhancements";
  return "identification";
}
