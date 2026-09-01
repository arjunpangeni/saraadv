import { LINE_ITEM_KEYS, type AnnualLineItems } from "@/lib/calc";

export type FinancialInputField = { key: keyof AnnualLineItems; label: string };

export const BALANCE_SHEET_INPUT_FIELDS: FinancialInputField[] = [
  { key: "ppe", label: "Property, Plant, Equipment" },
  { key: "ncaOthers", label: "Non-current assets — others" },
  { key: "inventory", label: "Inventory" },
  { key: "receivables", label: "Account Receivables" },
  { key: "cashAndBank", label: "Cash & Bank" },
  { key: "caOthers", label: "Current assets — others" },
  { key: "shareCapital", label: "Share Capital" },
  { key: "reserves", label: "Reserves" },
  { key: "equityOthers", label: "Capital — others" },
  { key: "longTermLoan", label: "Long Term Loan" },
  { key: "nclOthers", label: "Non-current liabilities — others" },
  { key: "shortTermLoans", label: "Short term loans" },
  { key: "payables", label: "Account Payables" },
  { key: "clOthers", label: "Current liabilities — others" },
];

export const PROFIT_LOSS_INPUT_FIELDS: FinancialInputField[] = [
  { key: "grossRevenue", label: "Gross Revenue" },
  { key: "costOfRevenue", label: "Cost of Revenue" },
  { key: "otherIncome", label: "Other Income" },
  { key: "adminExpenses", label: "Administrative Expenses" },
  { key: "financeCost", label: "Finance Cost" },
  { key: "depreciation", label: "Depreciation" },
  { key: "taxExpenses", label: "Tax Expenses" },
];

export const CASH_FLOW_INPUT_FIELDS: FinancialInputField[] = [
  { key: "cfo", label: "Cash flow from operating activities" },
  { key: "cfi", label: "Cash flow from investing activities" },
  { key: "cff", label: "Cash flow from financing activities" },
];

/** Input line items in the same order as the listing wizard matrices. */
export const FINANCIAL_INPUT_FIELDS: FinancialInputField[] = [
  ...BALANCE_SHEET_INPUT_FIELDS,
  ...PROFIT_LOSS_INPUT_FIELDS,
  ...CASH_FLOW_INPUT_FIELDS,
];

export const FORECAST_EXTRA_FIELDS = [
  { key: "revenueGrowthPct" as const, label: "Projected revenue growth %" },
  { key: "netMarginPct" as const, label: "Projected net profit margin %" },
  { key: "capex" as const, label: "Future CAPEX (Rs)" },
];

export type ForecastExtraKey = (typeof FORECAST_EXTRA_FIELDS)[number]["key"];

const FIELD_KEYS = new Set<string>(FINANCIAL_INPUT_FIELDS.map((f) => f.key));

export function isFinancialInputKey(key: string): key is keyof AnnualLineItems {
  return FIELD_KEYS.has(key);
}

export function isForecastExtraKey(key: string): key is ForecastExtraKey {
  return FORECAST_EXTRA_FIELDS.some((f) => f.key === key);
}

/** Guard so Excel rows stay aligned with the live form. */
export function financialFieldCoverage(): string[] {
  const missing = LINE_ITEM_KEYS.filter((key) => !FIELD_KEYS.has(key));
  const extra = FINANCIAL_INPUT_FIELDS.map((f) => f.key).filter((key) => !LINE_ITEM_KEYS.includes(key));
  return [...missing.map((k) => `missing:${k}`), ...extra.map((k) => `extra:${k}`)];
}
