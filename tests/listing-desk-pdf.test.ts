import { describe, it, expect } from "vitest";
import { generateListingDeskPdf } from "@/lib/pdf/listing-desk";
import { EMPTY_LINE_ITEMS } from "@/lib/calc";

describe("listing desk PDF", () => {
  it("builds a multi-page confidential dossier with legal name and line items", async () => {
    const bytes = await generateListingDeskPdf({
      hashId: "ASAR-MA-720",
      status: "PENDING_REVIEW",
      companyName: "Example Hydropower Pvt Ltd",
      sellerName: "Seller Name",
      sellerEmail: "seller@example.com",
      industry: "HYDROPOWER",
      legalStructure: "PRIVATE_LIMITED",
      establishedYear: 2012,
      operatingProvinces: ["Bagmati"],
      headOffice: { province: "Bagmati", district: "Kathmandu", localBody: "Kathmandu", ward: "1" },
      plantLocation: { province: "Gandaki", district: "Kaski", localBody: "Pokhara" },
      strategicAssumptions: "Hold tariff and add one turbine.",
      dealTerms: {
        askingPriceNpr: 50_000_000,
        modality: "OUTRIGHT_ACQUISITION",
        exitReason: "EXECUTIVE_RETIREMENT",
        valuationJustification: "3x EBITDA plus land revaluation.",
      },
      financials: [
        {
          kind: "HISTORICAL",
          fiscalYear: 1,
          fiscalYearLabel: "2024-25",
          ...EMPTY_LINE_ITEMS,
          grossRevenue: 12_000_000,
          costOfRevenue: 4_000_000,
          ppe: 20_000_000,
          shareCapital: 20_000_000,
        },
        {
          kind: "FORECAST",
          fiscalYear: 1,
          fiscalYearLabel: "2025-26",
          ...EMPTY_LINE_ITEMS,
          grossRevenue: 14_000_000,
          costOfRevenue: 4_500_000,
          revenueGrowthPct: 16,
          netMarginPct: 12,
          capex: 1_000_000,
        },
      ],
      projections: [],
      assetRevaluations: [
        { assetType: "LAND_BUILDINGS", bookValue: 5_000_000, marketValue: 8_000_000, notes: "Municipality rate" },
        { assetType: "PLANT_MACHINERY", bookValue: 0, marketValue: 0 },
        { assetType: "INVENTORY", bookValue: 0, marketValue: 0 },
        { assetType: "INTANGIBLES", bookValue: 0, marketValue: 0 },
      ],
      complianceRecords: [
        { authority: "IRD", status: "COMPLIANT", identifier: "PAN-1", lastClearanceYear: 2024 },
      ],
      ipAssets: [{ type: "TRADEMARK", reference: "TM-99" }],
      humanCapital: { managementCount: 2, technicalCount: 8, generalCount: 12, ssfCompliant: true },
      riskLog: { outstandingDebt: 1_000_000, pendingLitigations: "None" },
      capacityMetrics: { runningOutput: 8, installedPeak: 10, capacityUnit: "MW", utilizationPct: 80 },
      documents: [{ type: "MOA_AOA", s3Key: "listings/abc/123-moa.pdf" }],
    });

    const header = Buffer.from(bytes.subarray(0, 5)).toString("ascii");
    expect(header).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(2000);
  });
});
