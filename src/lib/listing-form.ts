import { EMPTY_LINE_ITEMS, LINE_ITEM_KEYS } from "@/lib/calc";
import { forecastFiscalYears, historicalFiscalYears } from "@/lib/fiscal-years";
import {
  COMPLIANCE_AUTHORITY_OPTIONS,
  REVALUATION_ASSET_TYPES,
} from "@/types/listing";

function n(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function moneyStr(value: unknown) {
  const num = n(value);
  return num === 0 ? "" : String(num);
}

function location(value: unknown) {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    province: String(row.province ?? ""),
    district: String(row.district ?? ""),
    localBody: String(row.localBody ?? ""),
    ward: String(row.ward ?? ""),
  };
}

function yearRow(
  fiscalYear: number,
  label: string,
  source?: Record<string, unknown>
) {
  const items = { ...EMPTY_LINE_ITEMS };
  if (source) {
    for (const key of LINE_ITEM_KEYS) {
      items[key] = n(source[key]);
    }
  }
  return {
    fiscalYear,
    fiscalYearLabel: String(source?.fiscalYearLabel || label),
    ...items,
    revenueGrowthPct: n(source?.revenueGrowthPct),
    netMarginPct: n(source?.netMarginPct),
    capex: n(source?.capex),
  };
}

type ListingForForm = {
  industry: string;
  legalStructure: string;
  establishedYear: number;
  operatingProvinces: string[];
  headOffice: unknown;
  plantLocation: unknown;
  strategicAssumptions: string | null;
  organization?: { name: string } | null;
  financials: Array<Record<string, unknown> & { kind: string; fiscalYear: number; fiscalYearLabel: string }>;
  projections: Array<{ year: number; revenueGrowthPct: unknown; netMarginPct: unknown; capex: unknown }>;
  assetRevaluations: Array<{ assetType: string; bookValue: unknown; marketValue: unknown; notes: string | null }>;
  complianceRecords: Array<{
    authority: string;
    status: string;
    identifier: string | null;
    lastClearanceYear: number | null;
    remarks: string | null;
  }>;
  ipAssets: Array<{ type: string; reference: string }>;
  dealTerms: {
    askingPriceNpr: unknown;
    modality: string;
    exitReason: string;
    valuationJustification: string;
  } | null;
  humanCapital: {
    managementCount: number;
    technicalCount: number;
    generalCount: number;
    ssfCompliant: boolean;
  } | null;
  riskLog: {
    outstandingDebt: unknown;
    assetEncumbrances: string | null;
    bankCollateralTies: string | null;
    pendingLitigations: string | null;
  } | null;
  capacityMetrics: {
    runningOutput: unknown;
    installedPeak: unknown;
    capacityUnit: string;
  } | null;
  documents: Array<{ s3Key: string; type: string }>;
};

export function listingToWizardDraft(listing: ListingForForm) {
  const historical = historicalFiscalYears();
  const forecast = forecastFiscalYears();
  const histRows = listing.financials.filter((f) => f.kind === "HISTORICAL");
  const forecastRows = listing.financials.filter((f) => f.kind === "FORECAST");
  const plant = location(listing.plantLocation);

  return {
    companyName: listing.organization?.name ?? "",
    industry: listing.industry,
    legalStructure: listing.legalStructure,
    establishedYear: String(listing.establishedYear || ""),
    operatingProvinces: listing.operatingProvinces,
    headOffice: location(listing.headOffice),
    hasPlant: Boolean(plant.province || plant.district || plant.localBody),
    plantLocation: plant,
    strategicAssumptions: listing.strategicAssumptions ?? "",
    financials: historical.map((y) =>
      yearRow(
        y.fiscalYear,
        y.label,
        histRows.find((r) => r.fiscalYear === y.fiscalYear)
      )
    ),
    projections: forecast.map((y) => {
      const fin = forecastRows.find((r) => r.fiscalYear === y.fiscalYear);
      const extra = listing.projections.find((p) => p.year === y.fiscalYear);
      return yearRow(y.fiscalYear, y.label, {
        ...(fin ?? {}),
        revenueGrowthPct: extra?.revenueGrowthPct ?? fin?.revenueGrowthPct,
        netMarginPct: extra?.netMarginPct ?? fin?.netMarginPct,
        capex: extra?.capex ?? fin?.capex,
      });
    }),
    assetRevaluations: REVALUATION_ASSET_TYPES.map((assetType) => {
      const row = listing.assetRevaluations.find((a) => a.assetType === assetType);
      return {
        assetType,
        bookValue: moneyStr(row?.bookValue),
        marketValue: moneyStr(row?.marketValue),
        notes: row?.notes ?? "",
      };
    }),
    complianceRecords: COMPLIANCE_AUTHORITY_OPTIONS.map((authority) => {
      const row = listing.complianceRecords.find((c) => c.authority === authority);
      return {
        authority,
        status: row?.status ?? "PENDING",
        identifier: row?.identifier ?? "",
        lastClearanceYear: row?.lastClearanceYear ? String(row.lastClearanceYear) : "",
        remarks: row?.remarks ?? "",
      };
    }),
    ipAssets: listing.ipAssets.map((ip) => ({ type: ip.type, reference: ip.reference })),
    askingPriceNpr: moneyStr(listing.dealTerms?.askingPriceNpr),
    modality: listing.dealTerms?.modality ?? "",
    exitReason: listing.dealTerms?.exitReason ?? "",
    valuationJustification: listing.dealTerms?.valuationJustification ?? "",
    managementCount: listing.humanCapital ? String(listing.humanCapital.managementCount) : "",
    technicalCount: listing.humanCapital ? String(listing.humanCapital.technicalCount) : "",
    generalCount: listing.humanCapital ? String(listing.humanCapital.generalCount) : "",
    ssfCompliant: listing.humanCapital?.ssfCompliant ?? false,
    outstandingDebt: moneyStr(listing.riskLog?.outstandingDebt),
    assetEncumbrances: listing.riskLog?.assetEncumbrances ?? "",
    bankCollateralTies: listing.riskLog?.bankCollateralTies ?? "",
    pendingLitigations: listing.riskLog?.pendingLitigations ?? "",
    runningOutput: moneyStr(listing.capacityMetrics?.runningOutput),
    installedPeak: moneyStr(listing.capacityMetrics?.installedPeak),
    capacityUnit: listing.capacityMetrics?.capacityUnit ?? "",
    documentKeys: listing.documents.map((d) => ({
      key: d.s3Key,
      type: d.type,
    })),
  };
}
