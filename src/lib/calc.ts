/**
 * Financial calculation helpers for the Buy/Sell listing matrices
 * (ASAR Partners Buy/Sell blueprint — Modules B & C).
 *
 * All monetary inputs are plain numbers (NPR). Kept dependency-free so it can
 * run identically on the client (live form calc) and server (persisted cache).
 */

export interface AnnualLineItems {
  ppe: number;
  ncaOthers: number;
  inventory: number;
  receivables: number;
  cashAndBank: number;
  caOthers: number;
  shareCapital: number;
  reserves: number;
  equityOthers: number;
  longTermLoan: number;
  nclOthers: number;
  shortTermLoans: number;
  payables: number;
  clOthers: number;
  grossRevenue: number;
  costOfRevenue: number;
  otherIncome: number;
  adminExpenses: number;
  financeCost: number;
  depreciation: number;
  taxExpenses: number;
  cfo: number;
  cfi: number;
  cff: number;
}

export interface AnnualFinancialComputed {
  ncaTotal: number;
  caTotal: number;
  totalAssets: number;
  equityTotal: number;
  nclTotal: number;
  clTotal: number;
  totalEquityLiabilities: number;
  grossProfit: number;
  ebitda: number;
  pbt: number;
  npat: number;
  cfTotal: number;
  balanced: boolean;
}

export type AnnualFinancialInput = AnnualLineItems;

export const EMPTY_LINE_ITEMS: AnnualLineItems = {
  ppe: 0,
  ncaOthers: 0,
  inventory: 0,
  receivables: 0,
  cashAndBank: 0,
  caOthers: 0,
  shareCapital: 0,
  reserves: 0,
  equityOthers: 0,
  longTermLoan: 0,
  nclOthers: 0,
  shortTermLoans: 0,
  payables: 0,
  clOthers: 0,
  grossRevenue: 0,
  costOfRevenue: 0,
  otherIncome: 0,
  adminExpenses: 0,
  financeCost: 0,
  depreciation: 0,
  taxExpenses: 0,
  cfo: 0,
  cfi: 0,
  cff: 0,
};

export const LINE_ITEM_KEYS = Object.keys(EMPTY_LINE_ITEMS) as (keyof AnnualLineItems)[];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeAnnualFinancials(input: AnnualLineItems): AnnualFinancialComputed {
  const ncaTotal = round2(input.ppe + input.ncaOthers);
  const caTotal = round2(input.inventory + input.receivables + input.cashAndBank + input.caOthers);
  const totalAssets = round2(ncaTotal + caTotal);
  const equityTotal = round2(input.shareCapital + input.reserves + input.equityOthers);
  const nclTotal = round2(input.longTermLoan + input.nclOthers);
  const clTotal = round2(input.shortTermLoans + input.payables + input.clOthers);
  const totalEquityLiabilities = round2(equityTotal + nclTotal + clTotal);
  const grossProfit = round2(input.grossRevenue - input.costOfRevenue);
  const ebitda = round2(grossProfit + input.otherIncome - input.adminExpenses);
  const pbt = round2(ebitda - input.financeCost - input.depreciation);
  const npat = round2(pbt - input.taxExpenses);
  const cfTotal = round2(input.cfo + input.cfi + input.cff);
  return {
    ncaTotal,
    caTotal,
    totalAssets,
    equityTotal,
    nclTotal,
    clTotal,
    totalEquityLiabilities,
    grossProfit,
    ebitda,
    pbt,
    npat,
    cfTotal,
    balanced: Math.abs(totalAssets - totalEquityLiabilities) < 0.5,
  };
}

export function persistableFinancials(input: AnnualLineItems): AnnualLineItems & AnnualFinancialComputed {
  return { ...input, ...computeAnnualFinancials(input) };
}

/** Plant Capacity utilization = running output / installed peak * 100 */
export function utilizationPct(runningOutput: number, installedPeak: number): number {
  if (!installedPeak) return 0;
  return round2((runningOutput / installedPeak) * 100);
}

/** Deal value band used by the marketplace filter engine (NPR, in Crore = 10,000,000). */
export type DealValueBand = "UNDER_1_CRORE" | "1_TO_5_CRORE" | "5_TO_10_CRORE" | "ABOVE_10_CRORE";

const CRORE = 10_000_000;

export function dealValueBand(askingPriceNpr: number): DealValueBand {
  const crore = askingPriceNpr / CRORE;
  if (crore < 1) return "UNDER_1_CRORE";
  if (crore < 5) return "1_TO_5_CRORE";
  if (crore < 10) return "5_TO_10_CRORE";
  return "ABOVE_10_CRORE";
}

export const DEAL_VALUE_BAND_LABELS: Record<DealValueBand, string> = {
  UNDER_1_CRORE: "Under Rs 1 Crore",
  "1_TO_5_CRORE": "Rs 1 – 5 Crore",
  "5_TO_10_CRORE": "Rs 5 – 10 Crore",
  ABOVE_10_CRORE: "Above Rs 10 Crore",
};

export function dealValueBandRange(band: DealValueBand): { min: number; max: number | null } {
  switch (band) {
    case "UNDER_1_CRORE":
      return { min: 0, max: 1 * CRORE };
    case "1_TO_5_CRORE":
      return { min: 1 * CRORE, max: 5 * CRORE };
    case "5_TO_10_CRORE":
      return { min: 5 * CRORE, max: 10 * CRORE };
    case "ABOVE_10_CRORE":
      return { min: 10 * CRORE, max: null };
  }
}

export function formatNpr(value: number): string {
  const amount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
  return `Rs ${amount}`;
}

/** Shorter NPR for cards: Rs 18.5 Cr, Rs 45 L. */
export function formatNprCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  const crore = value / CRORE;
  if (crore >= 100) return `Rs ${Math.round(crore)} Cr`;
  if (crore >= 1) {
    const digits = crore >= 10 ? 1 : 2;
    const n = crore.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1");
    return `Rs ${n} Cr`;
  }
  const lakh = value / 100_000;
  if (lakh >= 1) {
    const n = lakh >= 10 ? String(Math.round(lakh)) : lakh.toFixed(1).replace(/\.0$/, "");
    return `Rs ${n} L`;
  }
  return formatNpr(value);
}

export function formatCapacity(value: number, unit?: string | null): string {
  const amount = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${amount} ${unit}` : amount;
}
