import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { EMPTY_LINE_ITEMS } from "@/lib/calc";
import { historicalFiscalYears } from "@/lib/fiscal-years";
import { financialFieldCoverage } from "@/lib/listing-financial-fields";
import {
  buildFinancialWorkbook,
  copyPreviousFiscalYear,
  financialYearsToAoa,
  normalizeYearLabel,
  parseFinancialAoa,
  parseFinancialWorkbook,
  type FinancialExcelYear,
} from "@/lib/listing-excel";

function year(fiscalYear: number, label: string, extra?: Partial<FinancialExcelYear>): FinancialExcelYear {
  return {
    fiscalYear,
    fiscalYearLabel: label,
    ...EMPTY_LINE_ITEMS,
    ...extra,
  };
}

describe("listing financial Excel", () => {
  it("covers every live form line item", () => {
    expect(financialFieldCoverage()).toEqual([]);
  });

  it("normalizes year headers from Excel", () => {
    expect(normalizeYearLabel("2023-24")).toBe("2023-24");
    expect(normalizeYearLabel("2023-2024")).toBe("2023-24");
    expect(normalizeYearLabel("FY 2023/24")).toBe("2023-24");
  });

  it("round-trips historical figures through xlsx", async () => {
    const slots = historicalFiscalYears(new Date("2026-08-25"));
    const years = slots.map((slot, i) =>
      year(slot.fiscalYear, slot.label, { grossRevenue: 10_000_000 * (i + 1), ppe: 4_000_000 })
    );
    const bytes = await buildFinancialWorkbook(years, "historical");
    const empty = slots.map((slot) => year(slot.fiscalYear, slot.label));
    const parsed = await parseFinancialWorkbook(bytes, "template.xlsx", empty, "historical");
    expect(parsed.filled).toBeGreaterThan(0);
    expect(parsed.years[0].ppe).toBe(4_000_000);
    expect(parsed.years.map((y) => y.grossRevenue).sort((a, b) => a - b)).toEqual([10_000_000, 20_000_000, 30_000_000]);
  });

  it("matches 2023-2024 headers to 2023-24 columns", () => {
    const existing = [
      year(3, "2023-24"),
      year(2, "2024-25"),
      year(1, "2025-26"),
    ];
    const aoa = [
      ["Field", "Particulars", "2023-2024", "2024-2025", "2025-2026"],
      ["grossRevenue", "Gross Revenue", 95_000_000, 108_000_000, 124_000_000],
    ];
    const parsed = parseFinancialAoa(aoa, existing, "historical");
    expect(parsed.warnings).toEqual([]);
    expect(parsed.years.find((y) => y.fiscalYearLabel === "2023-24")?.grossRevenue).toBe(95_000_000);
    expect(parsed.years.find((y) => y.fiscalYearLabel === "2025-26")?.grossRevenue).toBe(124_000_000);
  });

  it("copies the previous (older) year into the selected year", () => {
    const years = [
      year(1, "2025-26", { inventory: 1 }),
      year(2, "2024-25", { inventory: 2 }),
      year(3, "2023-24", { inventory: 3, grossRevenue: 9 }),
    ];
    const copied = copyPreviousFiscalYear(years, 2);
    expect(copied.find((y) => y.fiscalYear === 2)?.inventory).toBe(3);
    expect(copied.find((y) => y.fiscalYear === 2)?.grossRevenue).toBe(9);
    expect(copied.find((y) => y.fiscalYear === 1)?.inventory).toBe(1);
  });

  it("includes forecast extra rows in the template", () => {
    const years = [year(1, "2026-27", { revenueGrowthPct: 12, grossRevenue: 5 })];
    const aoa = financialYearsToAoa(years, "forecast");
    const keys = aoa.map((row) => row[0]);
    expect(keys).toContain("revenueGrowthPct");
    expect(keys).toContain("grossRevenue");
    expect(keys).toContain("strategicAssumptions");
  });

  it("puts P&L and cash-flow fields on their own sheets", async () => {
    const years = [year(1, "2024-25", { grossRevenue: 9, cfo: 3, ppe: 1 })];
    const bytes = await buildFinancialWorkbook(years, "historical");
    const workbook = XLSX.read(bytes, { type: "array" });
    expect(workbook.SheetNames).toEqual(["Balance Sheet", "Profit & Loss", "Cash Flow"]);

    const keys = (name: string) => {
      const sheet = workbook.Sheets[name];
      if (!sheet) return [];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "", blankrows: true });
      return rows.map((row) => row[0] ?? "");
    };

    const pl = keys("Profit & Loss");
    expect(pl).toContain("grossRevenue");
    expect(pl).toContain("costOfRevenue");
    expect(pl).toContain("otherIncome");
    expect(pl).toContain("adminExpenses");
    expect(pl).toContain("financeCost");
    expect(pl).toContain("depreciation");
    expect(pl).toContain("taxExpenses");
    expect(pl).toContain("grossProfit");
    expect(pl).toContain("ebitda");
    expect(pl).toContain("npat");
    expect(pl).not.toContain("ppe");

    const cf = keys("Cash Flow");
    expect(cf).toContain("cfo");
    expect(cf).toContain("cfi");
    expect(cf).toContain("cff");
    expect(cf).toContain("cfTotal");
  });

  it("round-trips P&L and cash-flow figures from the multi-sheet template", async () => {
    const years = [
      year(1, "2024-25", { grossRevenue: 12, taxExpenses: 1, cfo: 4, cfi: -1, cff: 2 }),
      year(2, "2023-24"),
      year(3, "2022-23"),
    ];
    const bytes = await buildFinancialWorkbook(years, "historical");
    const empty = years.map((y) => year(y.fiscalYear, y.fiscalYearLabel));
    const parsed = await parseFinancialWorkbook(bytes, "template.xlsx", empty, "historical");
    expect(parsed.years.find((y) => y.fiscalYear === 1)?.grossRevenue).toBe(12);
    expect(parsed.years.find((y) => y.fiscalYear === 1)?.taxExpenses).toBe(1);
    expect(parsed.years.find((y) => y.fiscalYear === 1)?.cfo).toBe(4);
    expect(parsed.years.find((y) => y.fiscalYear === 1)?.cff).toBe(2);
  });

  it("imports figures from a CSV fallback", async () => {
    const existing = [year(1, "2024-25"), year(2, "2023-24"), year(3, "2022-23")];
    const csv = [
      "Field,Particulars,2024-25,2023-24,2022-23",
      "grossRevenue,Gross Revenue,12,8,5",
    ].join("\n");
    const parsed = await parseFinancialWorkbook(
      new TextEncoder().encode(csv),
      "template.csv",
      existing,
      "historical"
    );
    expect(parsed.years.find((y) => y.fiscalYearLabel === "2024-25")?.grossRevenue).toBe(12);
    expect(parsed.years.find((y) => y.fiscalYearLabel === "2022-23")?.grossRevenue).toBe(5);
  });

  it("imports forecast strategic assumptions from the first year column", () => {
    const existing = [year(1, "2026-27"), year(2, "2027-28"), year(3, "2028-29")];
    const aoa = [
      ["Field", "Particulars", "2026-27", "2027-28", "2028-29"],
      ["strategicAssumptions", "Strategic assumptions", "New plant in Lumbini"],
      ["grossRevenue", "Gross Revenue", 10, 12, 14],
    ];
    const parsed = parseFinancialAoa(aoa, existing, "forecast");
    expect(parsed.strategicAssumptions).toBe("New plant in Lumbini");
    expect(parsed.years.find((y) => y.fiscalYearLabel === "2026-27")?.grossRevenue).toBe(10);
  });
});
