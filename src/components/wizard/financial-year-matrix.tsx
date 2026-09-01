"use client";

import { useState } from "react";
import { formatNpr, computeAnnualFinancials, type AnnualLineItems } from "@/lib/calc";
import { displayYearOrder } from "@/lib/fiscal-years";
import { previousFiscalYear } from "@/lib/listing-excel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MatrixYearRow } from "@/lib/financial-matrix";

export type { MatrixYearRow };

type RowKind = "section" | "input" | "computed";

interface MatrixRow {
  kind: RowKind;
  label: string;
  key?: keyof AnnualLineItems | keyof ReturnType<typeof computeAnnualFinancials>;
  indent?: boolean;
}

const BS_ROWS: MatrixRow[] = [
  { kind: "section", label: "Assets" },
  { kind: "section", label: "Non-Current Assets" },
  { kind: "input", label: "Property, Plant, Equipment", key: "ppe", indent: true },
  { kind: "input", label: "Others", key: "ncaOthers", indent: true },
  { kind: "computed", label: "Total Non-Current Assets", key: "ncaTotal" },
  { kind: "section", label: "Current Assets" },
  { kind: "input", label: "Inventory", key: "inventory", indent: true },
  { kind: "input", label: "Account Receivables", key: "receivables", indent: true },
  { kind: "input", label: "Cash & Bank", key: "cashAndBank", indent: true },
  { kind: "input", label: "Others", key: "caOthers", indent: true },
  { kind: "computed", label: "Total Current Assets", key: "caTotal" },
  { kind: "computed", label: "Total Assets", key: "totalAssets" },
  { kind: "section", label: "Capital & Liabilities" },
  { kind: "input", label: "Share Capital", key: "shareCapital" },
  { kind: "input", label: "Reserves", key: "reserves" },
  { kind: "input", label: "Others", key: "equityOthers" },
  { kind: "computed", label: "Total Capital", key: "equityTotal" },
  { kind: "section", label: "Non-Current Liabilities" },
  { kind: "input", label: "Long Term Loan", key: "longTermLoan", indent: true },
  { kind: "input", label: "Others", key: "nclOthers", indent: true },
  { kind: "computed", label: "Total Non-Current Liabilities", key: "nclTotal" },
  { kind: "section", label: "Current Liabilities" },
  { kind: "input", label: "Short term loans", key: "shortTermLoans", indent: true },
  { kind: "input", label: "Account Payables", key: "payables", indent: true },
  { kind: "input", label: "Others", key: "clOthers", indent: true },
  { kind: "computed", label: "Total Current Liabilities", key: "clTotal" },
  { kind: "computed", label: "Total Capital & Liabilities", key: "totalEquityLiabilities" },
];

const PL_ROWS: MatrixRow[] = [
  { kind: "input", label: "Gross Revenue", key: "grossRevenue" },
  { kind: "input", label: "Cost of Revenue", key: "costOfRevenue" },
  { kind: "computed", label: "Gross Profit", key: "grossProfit" },
  { kind: "input", label: "Other Income", key: "otherIncome" },
  { kind: "input", label: "Administrative Expenses", key: "adminExpenses" },
  { kind: "computed", label: "EBITDA", key: "ebitda" },
  { kind: "input", label: "Finance Cost", key: "financeCost" },
  { kind: "input", label: "Depreciation", key: "depreciation" },
  { kind: "computed", label: "Profit Before Tax", key: "pbt" },
  { kind: "input", label: "Tax Expenses", key: "taxExpenses" },
  { kind: "computed", label: "Net Profit", key: "npat" },
];

const CF_ROWS: MatrixRow[] = [
  { kind: "input", label: "Cash flow from operating activities", key: "cfo" },
  { kind: "input", label: "Cash flow from investing activities", key: "cfi" },
  { kind: "input", label: "Cash flow from financing activities", key: "cff" },
  { kind: "computed", label: "Total", key: "cfTotal" },
];

const STATEMENTS = [
  { id: "bs" as const, title: "Balance Sheet", short: "Balance sheet" },
  { id: "pl" as const, title: "Profit & Loss", short: "P&L" },
  { id: "cf" as const, title: "Cash Flows", short: "Cash flow" },
];

const STATEMENT_ROWS: Record<(typeof STATEMENTS)[number]["id"], MatrixRow[]> = {
  bs: BS_ROWS,
  pl: PL_ROWS,
  cf: CF_ROWS,
};

function cellValue(row: MatrixYearRow, key: NonNullable<MatrixRow["key"]>): number {
  if (key in row) return Number(row[key as keyof MatrixYearRow] ?? 0);
  return Number(computeAnnualFinancials(row)[key as keyof ReturnType<typeof computeAnnualFinancials>] ?? 0);
}

function inputValue(raw: number | undefined): string {
  return raw === 0 || raw === undefined ? "" : String(raw);
}

function NumberField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full min-w-[8.5rem] rounded-lg border border-input bg-background px-3 text-right text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    />
  );
}

function StatementTable({
  rows,
  years,
  mobileYear,
  editable,
  onChange,
}: {
  rows: MatrixRow[];
  years: MatrixYearRow[];
  mobileYear: number;
  editable?: boolean;
  onChange?: (fiscalYear: number, key: keyof AnnualLineItems, value: string) => void;
}) {
  const columns = displayYearOrder(years);
  const mobileRow = columns.find((y) => y.fiscalYear === mobileYear) ?? columns[0];

  return (
    <>
      {mobileRow && (
        <div className="overflow-hidden rounded-2xl border border-border-subtle md:hidden">
          <dl>
            {rows.map((row, i) => {
              if (row.kind === "section") {
                return (
                  <div
                    key={`${row.label}-${i}`}
                    className="bg-surface-muted px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground"
                  >
                    {row.label}
                  </div>
                );
              }
              const value = cellValue(mobileRow, row.key!);
              return (
                <div
                  key={`${row.label}-${i}`}
                  className={cn(
                    "flex items-center justify-between gap-4 border-t border-border-subtle px-4 py-3",
                    row.kind === "computed" && "bg-brand-sky-muted/35"
                  )}
                >
                  <dt
                    className={cn(
                      "min-w-0 text-sm leading-snug",
                      row.indent && "pl-3 text-muted-foreground",
                      row.kind === "computed" && "font-semibold"
                    )}
                  >
                    {row.label}
                  </dt>
                  <dd className="w-[9.5rem] shrink-0 text-right text-sm">
                    {editable && row.kind === "input" && onChange && row.key ? (
                      <NumberField
                        value={inputValue(mobileRow[row.key as keyof AnnualLineItems])}
                        onChange={(v) => onChange(mobileRow.fiscalYear, row.key as keyof AnnualLineItems, v)}
                      />
                    ) : (
                      <span className={cn("tabular-nums", row.kind === "computed" && "font-semibold")}>
                        {formatNpr(value)}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      <div className="hidden overflow-x-auto rounded-2xl border border-border-subtle md:block">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="sticky left-0 z-10 min-w-[16rem] bg-surface-muted px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">
                Particulars
              </th>
              {columns.map((y) => (
                <th
                  key={y.fiscalYear}
                  className="min-w-[10.5rem] bg-surface-muted px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
                >
                  {y.fiscalYearLabel || `Year ${y.fiscalYear}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.kind === "section") {
                return (
                  <tr key={`${row.label}-${i}`} className="bg-surface-muted/60">
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={`${row.label}-${i}`} className="border-t border-border-subtle">
                  <td
                    className={cn(
                      "sticky left-0 z-10 bg-surface-elevated px-4 py-2.5",
                      row.indent && "pl-8 text-muted-foreground",
                      row.kind === "computed" && "font-semibold"
                    )}
                  >
                    {row.label}
                  </td>
                  {columns.map((y) => {
                    const value = cellValue(y, row.key!);
                    if (editable && row.kind === "input" && onChange && row.key) {
                      const key = row.key as keyof AnnualLineItems;
                      return (
                        <td key={y.fiscalYear} className="px-3 py-2">
                          <NumberField
                            value={inputValue(y[key])}
                            onChange={(v) => onChange(y.fiscalYear, key, v)}
                          />
                        </td>
                      );
                    }
                    return (
                      <td
                        key={y.fiscalYear}
                        className={cn(
                          "px-4 py-3 text-right tabular-nums",
                          row.kind === "computed" && "bg-brand-sky-muted/40 font-semibold"
                        )}
                      >
                        {formatNpr(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FinancialStatementTables({
  years,
  editable,
  onChange,
  onCopyPreviousYear,
}: {
  years: MatrixYearRow[];
  editable?: boolean;
  onChange?: (fiscalYear: number, key: keyof AnnualLineItems, value: string) => void;
  onCopyPreviousYear?: (fiscalYear: number) => void;
}) {
  const columns = displayYearOrder(years);
  const newestYear = columns[columns.length - 1]?.fiscalYear ?? 1;
  const [statement, setStatement] = useState<(typeof STATEMENTS)[number]["id"]>("bs");
  const [mobileYear, setMobileYear] = useState(newestYear);
  const computed = years.map((y) => ({ year: y, calc: computeAnnualFinancials(y) }));
  const unbalanced = computed.filter((c) => !c.calc.balanced);
  const showBalanceWarning = statement === "bs" && unbalanced.length > 0;
  const activeMobileYear = columns.some((y) => y.fiscalYear === mobileYear) ? mobileYear : newestYear;
  const previousYear = previousFiscalYear(years, activeMobileYear);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-border-subtle bg-surface-muted/40 p-1">
          {STATEMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatement(s.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium sm:px-4",
                statement === s.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>
        <select
          className="h-11 rounded-xl border border-border-subtle bg-background px-3 text-sm md:hidden"
          value={activeMobileYear}
          onChange={(e) => setMobileYear(Number(e.target.value))}
          aria-label="Fiscal year"
        >
          {columns.map((y) => (
            <option key={y.fiscalYear} value={y.fiscalYear}>
              {y.fiscalYearLabel || `Year ${y.fiscalYear}`}
            </option>
          ))}
        </select>
        {editable && onCopyPreviousYear && previousYear ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => onCopyPreviousYear(activeMobileYear)}
          >
            Copy {previousYear.fiscalYearLabel}
          </Button>
        ) : null}
      </div>

      <StatementTable
        rows={STATEMENT_ROWS[statement]}
        years={years}
        mobileYear={activeMobileYear}
        editable={editable}
        onChange={onChange}
      />

      {showBalanceWarning && (
        <p className="text-sm text-warning-fg">
          Balance sheet does not tie for{" "}
          {unbalanced.map((u) => u.year.fiscalYearLabel || `Year ${u.year.fiscalYear}`).join(", ")}
          : total assets should equal total capital &amp; liabilities.
        </p>
      )}
    </div>
  );
}
