/**
 * Nepal fiscal year helpers (Shrawan / mid-July start).
 * Labels are AD, e.g. "2025-26".
 */

const FY_START_MONTH = 6; // July (0-indexed)
const FY_START_DAY = 16;

export function nepalFiscalYearStartYear(date = new Date()): number {
  const month = date.getMonth();
  const day = date.getDate();
  if (month > FY_START_MONTH || (month === FY_START_MONTH && day >= FY_START_DAY)) {
    return date.getFullYear();
  }
  return date.getFullYear() - 1;
}

export function fiscalYearLabel(startYear: number): string {
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export interface FiscalYearSlot {
  fiscalYear: number;
  label: string;
}

/** Historical: fiscalYear 1 = most recently completed FY. */
export function historicalFiscalYears(date = new Date()): FiscalYearSlot[] {
  const lastCompletedStart = nepalFiscalYearStartYear(date) - 1;
  return [1, 2, 3].map((fiscalYear) => ({
    fiscalYear,
    label: fiscalYearLabel(lastCompletedStart - (fiscalYear - 1)),
  }));
}

/** Forecast: fiscalYear 1 = current / in-progress FY. */
export function forecastFiscalYears(date = new Date()): FiscalYearSlot[] {
  const currentStart = nepalFiscalYearStartYear(date);
  return [1, 2, 3].map((fiscalYear) => ({
    fiscalYear,
    label: fiscalYearLabel(currentStart + (fiscalYear - 1)),
  }));
}

export function establishedYearOptions(date = new Date()): number[] {
  const max = date.getFullYear();
  const years: number[] = [];
  for (let y = max; y >= 1900; y -= 1) years.push(y);
  return years;
}

/** Oldest → newest for spreadsheet columns. */
export function displayYearOrder<T extends { fiscalYear: number; fiscalYearLabel?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aStart = parseInt((a.fiscalYearLabel ?? "").split("-")[0] || "0", 10);
    const bStart = parseInt((b.fiscalYearLabel ?? "").split("-")[0] || "0", 10);
    if (aStart && bStart && aStart !== bStart) return aStart - bStart;
    return b.fiscalYear - a.fiscalYear;
  });
}
