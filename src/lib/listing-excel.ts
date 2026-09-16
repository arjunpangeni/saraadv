import * as XLSX from "xlsx";
import { LINE_ITEM_KEYS, type AnnualLineItems } from "@/lib/calc";
import { displayYearOrder } from "@/lib/fiscal-years";
import {
  BALANCE_SHEET_INPUT_FIELDS,
  CASH_FLOW_INPUT_FIELDS,
  FINANCIAL_INPUT_FIELDS,
  FORECAST_EXTRA_FIELDS,
  PROFIT_LOSS_INPUT_FIELDS,
  isFinancialInputKey,
  isForecastExtraKey,
  type FinancialInputField,
} from "@/lib/listing-financial-fields";

export type FinancialExcelKind = "historical" | "forecast";

export type FinancialExcelYear = {
  fiscalYear: number;
  fiscalYearLabel: string;
} & AnnualLineItems & {
  revenueGrowthPct?: number;
  netMarginPct?: number;
  capex?: number;
};

export type FinancialExcelParseResult<T extends FinancialExcelYear> = {
  years: T[];
  filled: number;
  warnings: string[];
  strategicAssumptions?: string;
};

const ASSUMPTIONS_KEY = "strategicAssumptions";
const ASSUMPTIONS_LABEL = "Strategic assumptions (one note for all years — write in the first year column)";

const FIELD_HEADER = "Field";
const LABEL_HEADER = "Particulars";

function extraRows(kind: FinancialExcelKind) {
  return kind === "forecast" ? FORECAST_EXTRA_FIELDS : [];
}

/** 2023-2024, 2023/24, FY 2023-24 → 2023-24 */
export function normalizeYearLabel(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  const match = compact.match(/(\d{4})\D+(\d{2,4})/);
  if (!match) return compact.toLowerCase();
  const start = match[1];
  const end = match[2].length === 4 ? match[2].slice(-2) : match[2];
  return `${start}-${end}`;
}

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseAmount(value: unknown): number | null {
  if (value === "" || value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/,/g, "").replace(/\s/g, "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function instruction(kind: FinancialExcelKind, labels: string[], sheet: string) {
  const title = kind === "forecast" ? "3-year forecast" : "3-year historical financials";
  const extra =
    sheet === "Assumptions"
      ? " Write strategic assumptions in the first year column. Growth %, margin %, and CAPEX are one row each."
      : " Grey/calculated rows update from the figures you type. Leave them alone.";
  return `ASAR Partners — ${title} — ${sheet} (NPR). Years: ${labels.join(", ")}. Fill year columns only. Do not rename Field or year headers. The file has Balance Sheet, Profit & Loss, and Cash Flow sheets. Upload this file on the listing form.${extra}`;
}

function colLetter(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

type TemplateLine =
  | { type: "input"; key: string; label: string }
  | { type: "calc"; key: string; label: string; parts: string[] };

type SheetSpec = {
  name: string;
  lines: TemplateLine[];
  extras?: boolean;
  assumptions?: boolean;
};

function inputLines(fields: FinancialInputField[]): TemplateLine[] {
  return fields.map((field) => ({ type: "input" as const, key: field.key, label: field.label }));
}

function sheetSpecs(kind: FinancialExcelKind): SheetSpec[] {
  const statements: SheetSpec[] = [
    {
      name: "Balance Sheet",
      lines: [
        ...inputLines(BALANCE_SHEET_INPUT_FIELDS.slice(0, 2)),
        { type: "calc", key: "ncaTotal", label: "Total Non-Current Assets (calculated)", parts: ["ppe", "ncaOthers"] },
        ...inputLines(BALANCE_SHEET_INPUT_FIELDS.slice(2, 6)),
        {
          type: "calc",
          key: "caTotal",
          label: "Total Current Assets (calculated)",
          parts: ["inventory", "receivables", "cashAndBank", "caOthers"],
        },
        { type: "calc", key: "totalAssets", label: "Total Assets (calculated)", parts: ["ncaTotal", "caTotal"] },
        ...inputLines(BALANCE_SHEET_INPUT_FIELDS.slice(6, 9)),
        {
          type: "calc",
          key: "equityTotal",
          label: "Total Capital (calculated)",
          parts: ["shareCapital", "reserves", "equityOthers"],
        },
        ...inputLines(BALANCE_SHEET_INPUT_FIELDS.slice(9, 11)),
        { type: "calc", key: "nclTotal", label: "Total Non-Current Liabilities (calculated)", parts: ["longTermLoan", "nclOthers"] },
        ...inputLines(BALANCE_SHEET_INPUT_FIELDS.slice(11)),
        {
          type: "calc",
          key: "clTotal",
          label: "Total Current Liabilities (calculated)",
          parts: ["shortTermLoans", "payables", "clOthers"],
        },
        {
          type: "calc",
          key: "totalEquityLiabilities",
          label: "Total Capital & Liabilities (calculated)",
          parts: ["equityTotal", "nclTotal", "clTotal"],
        },
      ],
    },
    {
      name: "Profit & Loss",
      lines: [
        { type: "input", key: "grossRevenue", label: "Gross Revenue" },
        { type: "input", key: "costOfRevenue", label: "Cost of Revenue" },
        { type: "calc", key: "grossProfit", label: "Gross Profit (calculated)", parts: ["grossRevenue", "-costOfRevenue"] },
        { type: "input", key: "otherIncome", label: "Other Income" },
        { type: "input", key: "adminExpenses", label: "Administrative Expenses" },
        { type: "calc", key: "ebitda", label: "EBITDA (calculated)", parts: ["grossProfit", "otherIncome", "-adminExpenses"] },
        { type: "input", key: "financeCost", label: "Finance Cost" },
        { type: "input", key: "depreciation", label: "Depreciation" },
        { type: "calc", key: "pbt", label: "Profit Before Tax (calculated)", parts: ["ebitda", "-financeCost", "-depreciation"] },
        { type: "input", key: "taxExpenses", label: "Tax Expenses" },
        { type: "calc", key: "npat", label: "Net Profit (calculated)", parts: ["pbt", "-taxExpenses"] },
      ],
    },
    {
      name: "Cash Flow",
      lines: [
        ...inputLines(CASH_FLOW_INPUT_FIELDS),
        { type: "calc", key: "cfTotal", label: "Cash flow total (calculated)", parts: ["cfo", "cfi", "cff"] },
      ],
    },
  ];
  if (kind === "forecast") {
    return [{ name: "Assumptions", lines: [], extras: true, assumptions: true }, ...statements];
  }
  return statements;
}

function formulaFromParts(letter: string, parts: string[], rowOf: (key: string) => number | undefined) {
  return parts
    .map((part, i) => {
      const subtract = part.startsWith("-");
      const key = subtract ? part.slice(1) : part;
      const row = rowOf(key);
      if (!row) return "";
      const ref = `${letter}${row}`;
      if (i === 0) return subtract ? `-${ref}` : ref;
      return subtract ? `-${ref}` : `+${ref}`;
    })
    .join("");
}

function sheetToAoa(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: true,
  });
}

function parseCsv(text: string): unknown[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: unknown[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      if (cell.endsWith("\r")) cell = cell.slice(0, -1);
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function writeSheet(workbook: XLSX.WorkBook, name: string, aoa: unknown[][], formulas: { addr: string; f: string }[]) {
  const sheet = XLSX.utils.aoa_to_sheet(aoa as (string | number | boolean)[][]);
  for (const { addr, f } of formulas) {
    if (!f) continue;
    sheet[addr] = { t: "n", f };
  }
  sheet["!cols"] = [{ wch: 22 }, { wch: 48 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function loadXlsx(data: Uint8Array) {
  return XLSX.read(data, { type: "array", cellDates: true });
}

function yearValue(year: FinancialExcelYear, key: string) {
  const n = Number(year[key as keyof FinancialExcelYear] ?? 0);
  return n === 0 ? "" : n;
}

export function financialYearsToAoa<T extends FinancialExcelYear>(
  years: T[],
  kind: FinancialExcelKind,
  extras?: { strategicAssumptions?: string }
): unknown[][] {
  const columns = displayYearOrder(years);
  const labels = columns.map((y) => y.fiscalYearLabel);
  const header = [FIELD_HEADER, LABEL_HEADER, ...labels];
  const rows: unknown[][] = [[instruction(kind, labels, "All statements")], [], header];

  if (kind === "forecast") {
    rows.push([
      ASSUMPTIONS_KEY,
      ASSUMPTIONS_LABEL,
      extras?.strategicAssumptions?.trim() || "",
      ...columns.slice(1).map(() => ""),
    ]);
  }

  for (const field of extraRows(kind)) {
    rows.push([
      field.key,
      field.label,
      ...columns.map((y) => {
        const n = Number(y[field.key] ?? 0);
        return n === 0 ? "" : n;
      }),
    ]);
  }

  for (const field of FINANCIAL_INPUT_FIELDS) {
    rows.push([
      field.key,
      field.label,
      ...columns.map((y) => {
        const n = Number(y[field.key] ?? 0);
        return n === 0 ? "" : n;
      }),
    ]);
  }

  return rows;
}

function buildStatementAoa<T extends FinancialExcelYear>(
  years: T[],
  kind: FinancialExcelKind,
  spec: SheetSpec,
  extras?: { strategicAssumptions?: string }
): { aoa: unknown[][]; formulas: { addr: string; f: string }[] } {
  const columns = displayYearOrder(years);
  const labels = columns.map((y) => y.fiscalYearLabel);
  const header = [FIELD_HEADER, LABEL_HEADER, ...labels];
  const aoa: unknown[][] = [[instruction(kind, labels, spec.name)], [], header];
  const formulas: { addr: string; f: string }[] = [];
  const keyRow = new Map<string, number>();
  let excelRow = 3;

  const push = (row: unknown[], key?: string) => {
    aoa.push(row);
    excelRow += 1;
    if (key) keyRow.set(key, excelRow);
  };

  if (spec.assumptions) {
    push(
      [
        ASSUMPTIONS_KEY,
        ASSUMPTIONS_LABEL,
        extras?.strategicAssumptions?.trim() || "",
        ...columns.slice(1).map(() => ""),
      ],
      ASSUMPTIONS_KEY
    );
  }

  if (spec.extras) {
    for (const field of FORECAST_EXTRA_FIELDS) {
      push([field.key, field.label, ...columns.map((y) => yearValue(y, field.key))], field.key);
    }
  }

  for (const line of spec.lines) {
    if (line.type === "input") {
      push([line.key, line.label, ...columns.map((y) => yearValue(y, line.key))], line.key);
      continue;
    }
    push([line.key, line.label, ...columns.map(() => "")], line.key);
    columns.forEach((_, i) => {
      const letter = colLetter(2 + i);
      formulas.push({
        addr: `${letter}${excelRow}`,
        f: formulaFromParts(letter, line.parts, (key) => keyRow.get(key)),
      });
    });
  }

  return { aoa, formulas };
}

export function parseFinancialAoa<T extends FinancialExcelYear>(
  rows: unknown[][],
  existing: T[],
  kind: FinancialExcelKind
): FinancialExcelParseResult<T> {
  const warnings: string[] = [];
  const headerIndex = rows.findIndex((row) => cellString(row?.[0]).toLowerCase() === FIELD_HEADER.toLowerCase());
  if (headerIndex < 0) {
    return {
      years: existing,
      filled: 0,
      warnings: ["This file is not a ASAR financial template. Download the template and keep the Field column."],
    };
  }

  const header = rows[headerIndex] ?? [];
  const ordered = displayYearOrder(existing);
  const yearCols: { col: number; year: T }[] = [];
  const used = new Set<number>();

  for (let col = 2; col < header.length; col += 1) {
    const label = normalizeYearLabel(cellString(header[col]));
    if (!label) continue;
    const year = ordered.find((y, i) => !used.has(i) && normalizeYearLabel(y.fiscalYearLabel) === label);
    if (!year) continue;
    used.add(ordered.indexOf(year));
    yearCols.push({ col, year });
  }

  if (yearCols.length === 0 && ordered.length > 0) {
    const numericCols = header
      .map((_, col) => col)
      .filter((col) => col >= 2 && cellString(header[col]));
    if (numericCols.length >= ordered.length) {
      warnings.push("Year headers did not match. Figures were applied left-to-right in fiscal-year order.");
      ordered.forEach((year, i) => {
        yearCols.push({ col: numericCols[i], year });
      });
    }
  }

  if (yearCols.length === 0) {
    return {
      years: existing,
      filled: 0,
      warnings: [
        `Could not match year columns. Expected ${ordered.map((y) => y.fiscalYearLabel).join(", ")}.`,
      ],
    };
  }

  if (yearCols.length < ordered.length) {
    const missing = ordered
      .filter((y) => !yearCols.some((c) => c.year.fiscalYear === y.fiscalYear))
      .map((y) => y.fiscalYearLabel);
    warnings.push(`No column for ${missing.join(", ")}. Other years were imported.`);
  }

  const byFy = new Map<number, T>(existing.map((y) => [y.fiscalYear, { ...y }]));
  let filled = 0;
  let strategicAssumptions: string | undefined;

  for (let r = headerIndex + 1; r < rows.length; r += 1) {
    const row = rows[r] ?? [];
    const key = cellString(row[0]);
    if (!key) continue;

    if (kind === "forecast" && key === ASSUMPTIONS_KEY) {
      const fromYears = yearCols
        .map(({ col }) => cellString(row[col]))
        .filter(Boolean)
        .join(" ")
        .trim();
      strategicAssumptions = fromYears || undefined;
      continue;
    }

    const lineKey = isFinancialInputKey(key) ? key : null;
    const extraKey = kind === "forecast" && isForecastExtraKey(key) ? key : null;
    if (!lineKey && !extraKey) continue;

    for (const { col, year } of yearCols) {
      const amount = parseAmount(row[col]);
      if (amount == null) continue;
      const current = byFy.get(year.fiscalYear);
      if (!current) continue;
      if (lineKey) current[lineKey] = amount;
      if (extraKey) current[extraKey] = amount;
      byFy.set(year.fiscalYear, current);
      filled += 1;
    }
  }

  if (filled === 0 && !strategicAssumptions) {
    warnings.push("No figures found. Fill the year columns in NPR, then upload again.");
  }

  return {
    years: existing.map((y) => byFy.get(y.fiscalYear) ?? y),
    filled,
    warnings,
    strategicAssumptions,
  };
}

export async function buildFinancialWorkbook<T extends FinancialExcelYear>(
  years: T[],
  kind: FinancialExcelKind,
  extras?: { strategicAssumptions?: string }
): Promise<Uint8Array> {
  const workbook = XLSX.utils.book_new();
  for (const spec of sheetSpecs(kind)) {
    const { aoa, formulas } = buildStatementAoa(years, kind, spec, extras);
    writeSheet(workbook, spec.name, aoa, formulas);
  }
  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return toUint8Array(output);
}

export async function parseFinancialWorkbook<T extends FinancialExcelYear>(
  data: ArrayBuffer | Uint8Array,
  filename: string,
  existing: T[],
  kind: FinancialExcelKind
): Promise<FinancialExcelParseResult<T>> {
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  const lower = filename.toLowerCase();

  if (lower.endsWith(".csv")) {
    return parseFinancialAoa(parseCsv(new TextDecoder().decode(buffer)), existing, kind);
  }

  if (lower.endsWith(".xls") && !lower.endsWith(".xlsx")) {
    return {
      years: existing,
      filled: 0,
      warnings: ["Legacy .xls is not supported. Download the template and upload a .xlsx file."],
    };
  }

  const workbook = loadXlsx(buffer);
  if (workbook.SheetNames.length === 0) {
    return { years: existing, filled: 0, warnings: ["The spreadsheet is empty."] };
  }

  let years = existing;
  let filled = 0;
  let strategicAssumptions: string | undefined;
  const warningSet = new Set<string>();
  let sawHeader = false;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = sheetToAoa(sheet);
    if (!rows.some((row) => cellString(row?.[0]).toLowerCase() === FIELD_HEADER.toLowerCase())) {
      continue;
    }
    sawHeader = true;
    const result = parseFinancialAoa(rows, years, kind);
    years = result.years;
    filled += result.filled;
    if (result.strategicAssumptions) strategicAssumptions = result.strategicAssumptions;
    for (const warning of result.warnings) {
      if (warning.startsWith("No figures found")) continue;
      warningSet.add(warning);
    }
  }

  if (!sawHeader) {
    return {
      years: existing,
      filled: 0,
      warnings: ["This file is not a ASAR financial template. Download the template and keep the Field column."],
    };
  }

  const warnings = [...warningSet];
  if (filled === 0 && !strategicAssumptions) {
    warnings.push("No figures found. Fill the year columns in NPR, then upload again.");
  }

  return { years, filled, warnings, strategicAssumptions };
}

export function financialTemplateFilename(kind: FinancialExcelKind, years: FinancialExcelYear[]): string {
  const labels = displayYearOrder(years)
    .map((y) => y.fiscalYearLabel.replace(/\s+/g, ""))
    .join("_");
  const slug = kind === "forecast" ? "forecast" : "historical";
  return `asar-listing-${slug}-${labels || "template"}.xlsx`;
}

export function copyPreviousFiscalYear<T extends FinancialExcelYear>(years: T[], targetFiscalYear: number): T[] {
  const ordered = displayYearOrder(years);
  const index = ordered.findIndex((y) => y.fiscalYear === targetFiscalYear);
  if (index <= 0) return years;
  const source = ordered[index - 1];
  return years.map((row) => {
    if (row.fiscalYear !== targetFiscalYear) return row;
    const next = { ...row };
    for (const key of LINE_ITEM_KEYS) next[key] = source[key];
    for (const field of FORECAST_EXTRA_FIELDS) {
      next[field.key] = source[field.key] ?? 0;
    }
    return next;
  });
}

export function previousFiscalYear<T extends FinancialExcelYear>(
  years: T[],
  targetFiscalYear: number
): T | null {
  const ordered = displayYearOrder(years);
  const index = ordered.findIndex((y) => y.fiscalYear === targetFiscalYear);
  return index > 0 ? ordered[index - 1] : null;
}
