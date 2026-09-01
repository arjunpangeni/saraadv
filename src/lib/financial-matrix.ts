import { EMPTY_LINE_ITEMS, LINE_ITEM_KEYS, type AnnualLineItems } from "@/lib/calc";

export type MatrixYearRow = AnnualLineItems & {
  fiscalYear: number;
  fiscalYearLabel: string;
};

export function toMatrixYear(
  row: AnnualLineItems & { fiscalYear: number; fiscalYearLabel?: string | null }
): MatrixYearRow {
  const items = { ...EMPTY_LINE_ITEMS };
  for (const key of LINE_ITEM_KEYS) {
    items[key] = Number(row[key] ?? 0);
  }
  return {
    ...items,
    fiscalYear: row.fiscalYear,
    fiscalYearLabel: row.fiscalYearLabel || `Year ${row.fiscalYear}`,
  };
}
