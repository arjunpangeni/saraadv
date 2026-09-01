import { describe, it, expect } from "vitest";
import {
  computeAnnualFinancials,
  EMPTY_LINE_ITEMS,
  utilizationPct,
  dealValueBand,
  dealValueBandRange,
  formatNprCompact,
} from "@/lib/calc";

describe("financial calculations (Buy/Sell Module B)", () => {
  const sample = {
    ...EMPTY_LINE_ITEMS,
    grossRevenue: 10_000_000,
    costOfRevenue: 4_000_000,
    otherIncome: 0,
    adminExpenses: 2_000_000,
    financeCost: 300_000,
    depreciation: 500_000,
    taxExpenses: 400_000,
  };

  it("computes Gross Profit = Gross Revenue - Cost of Revenue", () => {
    expect(computeAnnualFinancials(sample).grossProfit).toBe(6_000_000);
  });

  it("computes EBITDA = Gross Profit + Other Income - Admin Expenses", () => {
    expect(computeAnnualFinancials(sample).ebitda).toBe(4_000_000);
  });

  it("computes PBT and NPAT from EBITDA", () => {
    const result = computeAnnualFinancials(sample);
    expect(result.pbt).toBe(3_200_000);
    expect(result.npat).toBe(2_800_000);
  });

  it("totals assets and equity/liabilities", () => {
    const result = computeAnnualFinancials({
      ...EMPTY_LINE_ITEMS,
      ppe: 5_000_000,
      ncaOthers: 1_000_000,
      inventory: 2_000_000,
      cashAndBank: 1_000_000,
      shareCapital: 4_000_000,
      reserves: 3_000_000,
      longTermLoan: 2_000_000,
    });
    expect(result.ncaTotal).toBe(6_000_000);
    expect(result.caTotal).toBe(3_000_000);
    expect(result.totalAssets).toBe(9_000_000);
    expect(result.equityTotal).toBe(7_000_000);
    expect(result.nclTotal).toBe(2_000_000);
    expect(result.totalEquityLiabilities).toBe(9_000_000);
    expect(result.balanced).toBe(true);
  });

  it("handles zero revenue without throwing", () => {
    const result = computeAnnualFinancials(EMPTY_LINE_ITEMS);
    expect(result.grossProfit).toBe(0);
    expect(result.ebitda).toBe(0);
    expect(result.npat).toBe(0);
  });
});

describe("plant capacity utilization", () => {
  it("computes utilization percentage", () => {
    expect(utilizationPct(750, 1000)).toBe(75);
  });

  it("returns 0 when installed peak is 0 (avoids divide-by-zero)", () => {
    expect(utilizationPct(100, 0)).toBe(0);
  });
});

describe("deal value bands (marketplace filter engine)", () => {
  const CRORE = 10_000_000;

  it("classifies under 1 crore", () => {
    expect(dealValueBand(0.5 * CRORE)).toBe("UNDER_1_CRORE");
  });

  it("classifies 1-5 crore", () => {
    expect(dealValueBand(3 * CRORE)).toBe("1_TO_5_CRORE");
  });

  it("classifies 5-10 crore", () => {
    expect(dealValueBand(7 * CRORE)).toBe("5_TO_10_CRORE");
  });

  it("classifies above 10 crore", () => {
    expect(dealValueBand(15 * CRORE)).toBe("ABOVE_10_CRORE");
  });

  it("dealValueBandRange returns consistent bounds", () => {
    expect(dealValueBandRange("UNDER_1_CRORE")).toEqual({ min: 0, max: CRORE });
    expect(dealValueBandRange("ABOVE_10_CRORE")).toEqual({ min: 10 * CRORE, max: null });
  });
});

describe("formatNprCompact", () => {
  it("formats crore values for cards", () => {
    expect(formatNprCompact(18_500_000)).toBe("Rs 1.85 Cr");
    expect(formatNprCompact(185_000_000)).toBe("Rs 18.5 Cr");
    expect(formatNprCompact(1_200_000_000)).toBe("Rs 120 Cr");
  });

  it("formats lakh values under 1 crore", () => {
    expect(formatNprCompact(4_500_000)).toBe("Rs 45 L");
    expect(formatNprCompact(250_000)).toBe("Rs 2.5 L");
  });

  it("returns em dash for missing amounts", () => {
    expect(formatNprCompact(0)).toBe("—");
    expect(formatNprCompact(Number.NaN)).toBe("—");
  });
});
