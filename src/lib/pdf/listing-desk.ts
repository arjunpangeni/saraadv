import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { computeAnnualFinancials, EMPTY_LINE_ITEMS, formatNpr, LINE_ITEM_KEYS } from "@/lib/calc";
import { displayYearOrder } from "@/lib/fiscal-years";
import { FORECAST_EXTRA_FIELDS } from "@/lib/listing-financial-fields";
import {
  COMPLIANCE_AUTHORITY_LABELS,
  REVALUATION_ASSET_LABELS,
  exitReasonLabel,
  industryLabel,
  legalStructureLabel,
  modalityLabel,
} from "@/types/listing";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 46;
const NAVY = rgb(0, 0.09, 0.28);
const NAVY_SOFT = rgb(0.93, 0.95, 0.97);
const ZEBRA = rgb(0.965, 0.972, 0.98);
const TOTAL_BG = rgb(0.88, 0.91, 0.95);
const SECTION_BG = rgb(0.82, 0.86, 0.91);
const GRID = rgb(0.76, 0.8, 0.85);
const TEXT = rgb(0.08, 0.1, 0.14);
const MUTED = rgb(0.35, 0.4, 0.45);
const WHITE = rgb(1, 1, 1);
const HAIR = rgb(0.88, 0.9, 0.93);

type RowKind = "input" | "total" | "section";

type PdfRow = {
  cells: string[];
  kind?: RowKind;
  indent?: boolean;
};

type MatrixLine = {
  kind: RowKind;
  label: string;
  key?: string;
  indent?: boolean;
};

const BS_LINES: MatrixLine[] = [
  { kind: "section", label: "Assets" },
  { kind: "section", label: "Non-Current Assets" },
  { kind: "input", label: "Property, Plant, Equipment", key: "ppe", indent: true },
  { kind: "input", label: "Others", key: "ncaOthers", indent: true },
  { kind: "total", label: "Total Non-Current Assets", key: "ncaTotal" },
  { kind: "section", label: "Current Assets" },
  { kind: "input", label: "Inventory", key: "inventory", indent: true },
  { kind: "input", label: "Account Receivables", key: "receivables", indent: true },
  { kind: "input", label: "Cash & Bank", key: "cashAndBank", indent: true },
  { kind: "input", label: "Others", key: "caOthers", indent: true },
  { kind: "total", label: "Total Current Assets", key: "caTotal" },
  { kind: "total", label: "Total Assets", key: "totalAssets" },
  { kind: "section", label: "Capital & Liabilities" },
  { kind: "input", label: "Share Capital", key: "shareCapital" },
  { kind: "input", label: "Reserves", key: "reserves" },
  { kind: "input", label: "Others", key: "equityOthers" },
  { kind: "total", label: "Total Capital", key: "equityTotal" },
  { kind: "section", label: "Non-Current Liabilities" },
  { kind: "input", label: "Long Term Loan", key: "longTermLoan", indent: true },
  { kind: "input", label: "Others", key: "nclOthers", indent: true },
  { kind: "total", label: "Total Non-Current Liabilities", key: "nclTotal" },
  { kind: "section", label: "Current Liabilities" },
  { kind: "input", label: "Short term loans", key: "shortTermLoans", indent: true },
  { kind: "input", label: "Account Payables", key: "payables", indent: true },
  { kind: "input", label: "Others", key: "clOthers", indent: true },
  { kind: "total", label: "Total Current Liabilities", key: "clTotal" },
  { kind: "total", label: "Total Capital & Liabilities", key: "totalEquityLiabilities" },
];

const PL_LINES: MatrixLine[] = [
  { kind: "input", label: "Gross Revenue", key: "grossRevenue" },
  { kind: "input", label: "Cost of Revenue", key: "costOfRevenue" },
  { kind: "total", label: "Gross Profit", key: "grossProfit" },
  { kind: "input", label: "Other Income", key: "otherIncome" },
  { kind: "input", label: "Administrative Expenses", key: "adminExpenses" },
  { kind: "total", label: "EBITDA", key: "ebitda" },
  { kind: "input", label: "Finance Cost", key: "financeCost" },
  { kind: "input", label: "Depreciation", key: "depreciation" },
  { kind: "total", label: "Profit Before Tax", key: "pbt" },
  { kind: "input", label: "Tax Expenses", key: "taxExpenses" },
  { kind: "total", label: "Net Profit", key: "npat" },
];

const CF_LINES: MatrixLine[] = [
  { kind: "input", label: "Operating activities", key: "cfo" },
  { kind: "input", label: "Investing activities", key: "cfi" },
  { kind: "input", label: "Financing activities", key: "cff" },
  { kind: "total", label: "Cash flow total", key: "cfTotal" },
];

export type DeskListingPdfInput = {
  hashId: string;
  status: string;
  companyName?: string | null;
  sellerName?: string | null;
  sellerEmail?: string | null;
  industry: string;
  legalStructure: string;
  establishedYear: number;
  operatingProvinces: string[];
  headOffice: unknown;
  plantLocation: unknown;
  strategicAssumptions?: string | null;
  reviewNotes?: string | null;
  dealTerms?: {
    askingPriceNpr: unknown;
    modality: string;
    exitReason: string;
    valuationJustification: string;
  } | null;
  financials: Record<string, unknown>[];
  projections: { year: number; revenueGrowthPct: unknown; netMarginPct: unknown; capex: unknown }[];
  assetRevaluations: { assetType: string; bookValue: unknown; marketValue: unknown; notes?: string | null }[];
  complianceRecords: {
    authority: string;
    status: string;
    identifier?: string | null;
    lastClearanceYear?: number | null;
    remarks?: string | null;
    outstandingDisputes?: string | null;
  }[];
  ipAssets: { type: string; reference: string }[];
  humanCapital?: {
    managementCount: number;
    technicalCount: number;
    generalCount: number;
    ssfCompliant: boolean;
  } | null;
  riskLog?: {
    outstandingDebt: unknown;
    assetEncumbrances?: string | null;
    bankCollateralTies?: string | null;
    pendingLitigations?: string | null;
  } | null;
  capacityMetrics?: {
    runningOutput: unknown;
    installedPeak: unknown;
    capacityUnit?: string | null;
    utilizationPct?: unknown;
  } | null;
  documents: { type: string; label?: string | null; s3Key?: string | null }[];
};

function pdfSafe(value: string) {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function money(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "-";
  return formatNpr(n);
}

function place(value: unknown) {
  const loc = value as { localBody?: string; district?: string; province?: string; ward?: string } | null;
  if (!loc) return "-";
  const parts = [loc.ward ? `Ward ${loc.ward}` : "", loc.localBody, loc.district, loc.province].filter(Boolean);
  return parts.join(", ") || "-";
}

function wrapToWidth(text: string, font: PDFFont, size: number, maxWidth: number) {
  const safe = pdfSafe(text || "-");
  const words = safe.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  const fitted: string[] = [];
  for (const line of lines.length ? lines : ["-"]) {
    if (font.widthOfTextAtSize(line, size) <= maxWidth) {
      fitted.push(line);
      continue;
    }
    let chunk = "";
    for (const ch of line) {
      const next = chunk + ch;
      if (chunk && font.widthOfTextAtSize(next, size) > maxWidth) {
        fitted.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    if (chunk) fitted.push(chunk);
  }
  return fitted;
}

function yearMoney(row: Record<string, unknown> | undefined, key: string) {
  if (!row) return "-";
  return money(row[key]);
}

function fileName(s3Key?: string | null) {
  if (!s3Key) return "";
  const part = s3Key.split("/").pop() ?? s3Key;
  return part.replace(/^\d+-/, "");
}

function yearRecord(row: Record<string, unknown>) {
  const items = { ...EMPTY_LINE_ITEMS };
  for (const key of LINE_ITEM_KEYS) {
    items[key] = Number(row[key] ?? 0);
  }
  return {
    ...items,
    ...computeAnnualFinancials(items),
    kind: String(row.kind ?? ""),
    fiscalYear: Number(row.fiscalYear),
    fiscalYearLabel: String(row.fiscalYearLabel || `Year ${row.fiscalYear}`),
    revenueGrowthPct: row.revenueGrowthPct == null ? undefined : Number(row.revenueGrowthPct),
    netMarginPct: row.netMarginPct == null ? undefined : Number(row.netMarginPct),
    capex: row.capex == null ? undefined : Number(row.capex),
  };
}

function authorityLabel(value: string) {
  return COMPLIANCE_AUTHORITY_LABELS[value as keyof typeof COMPLIANCE_AUTHORITY_LABELS] ?? value.replace(/_/g, " ");
}

function statementRows(years: Record<string, unknown>[], lines: MatrixLine[]): PdfRow[] {
  return lines.map((line) => ({
    cells: [
      line.label,
      ...(line.kind === "section" ? years.map(() => "") : years.map((y) => yearMoney(y, line.key ?? ""))),
    ],
    kind: line.kind,
    indent: line.indent,
  }));
}

class DeskPdfWriter {
  private readonly pdf: PDFDocument;
  private page!: PDFPage;
  private y = 780;
  private pageNo = 0;
  private zebra = false;
  private readonly hashId: string;

  constructor(
    pdf: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
    hashId: string
  ) {
    this.pdf = pdf;
    this.hashId = hashId;
  }

  static async create(hashId: string) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const writer = new DeskPdfWriter(pdf, font, bold, hashId);
    writer.newPage();
    return writer;
  }

  private newPage() {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.pageNo += 1;
    this.page.drawRectangle({ x: 0, y: PAGE_H - 32, width: PAGE_W, height: 32, color: NAVY });
    this.page.drawText("ASAR PARTNERS", {
      x: MARGIN,
      y: PAGE_H - 20,
      size: 9,
      font: this.bold,
      color: WHITE,
    });
    this.page.drawText("Confidential desk dossier", {
      x: MARGIN + 108,
      y: PAGE_H - 20,
      size: 8,
      font: this.font,
      color: rgb(0.75, 0.8, 0.86),
    });
    const id = pdfSafe(this.hashId);
    this.page.drawText(id, {
      x: PAGE_W - MARGIN - this.bold.widthOfTextAtSize(id, 8),
      y: PAGE_H - 20,
      size: 8,
      font: this.bold,
      color: WHITE,
    });
    const footer = `Desk only  ·  Page ${this.pageNo}`;
    this.page.drawText(footer, {
      x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(footer, 8),
      y: 24,
      size: 8,
      font: this.font,
      color: MUTED,
    });
    this.y = PAGE_H - 50;
    this.zebra = false;
  }

  private ensure(height: number) {
    if (this.y - height < BOTTOM) this.newPage();
  }

  gap(px = 12) {
    this.y -= px;
  }

  heading(title: string) {
    this.ensure(34);
    this.y -= 6;
    this.page.drawText(pdfSafe(title), { x: MARGIN, y: this.y, size: 12, font: this.bold, color: NAVY });
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 1,
      color: NAVY,
    });
    this.y -= 12;
    this.zebra = false;
  }

  subheading(title: string) {
    this.ensure(22);
    this.page.drawText(pdfSafe(title), { x: MARGIN, y: this.y, size: 9.5, font: this.bold, color: NAVY });
    this.y -= 14;
    this.zebra = false;
  }

  note(text: string) {
    const size = 8.5;
    const lines = wrapToWidth(text, this.font, size, CONTENT_W - 16);
    const h = lines.length * 12 + 12;
    this.ensure(h);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - h,
      width: CONTENT_W,
      height: h,
      color: NAVY_SOFT,
    });
    lines.forEach((line, i) => {
      this.page.drawText(line, {
        x: MARGIN + 8,
        y: this.y - 14 - i * 12,
        size,
        font: this.font,
        color: MUTED,
      });
    });
    this.y -= h + 8;
  }

  identity(name: string, meta: string, metrics: [string, string][]) {
    this.ensure(88);
    const title = pdfSafe(name);
    const titleSize = this.bold.widthOfTextAtSize(title, 16) > CONTENT_W ? 13 : 16;
    this.page.drawText(title, { x: MARGIN, y: this.y, size: titleSize, font: this.bold, color: NAVY });
    this.y -= 16;
    this.page.drawText(pdfSafe(meta), { x: MARGIN, y: this.y, size: 9, font: this.font, color: MUTED });
    this.y -= 18;

    const gap = 8;
    const boxW = (CONTENT_W - gap * (metrics.length - 1)) / metrics.length;
    const boxH = 38;
    this.ensure(boxH + 8);
    metrics.forEach(([label, value], i) => {
      const x = MARGIN + i * (boxW + gap);
      this.page.drawRectangle({
        x,
        y: this.y - boxH,
        width: boxW,
        height: boxH,
        color: NAVY_SOFT,
        borderColor: GRID,
        borderWidth: 0.6,
      });
      this.page.drawText(pdfSafe(label).toUpperCase(), {
        x: x + 8,
        y: this.y - 13,
        size: 7,
        font: this.bold,
        color: MUTED,
      });
      const valueLines = wrapToWidth(value, this.bold, 10, boxW - 16);
      this.page.drawText(valueLines[0] ?? "-", {
        x: x + 8,
        y: this.y - 28,
        size: 10,
        font: this.bold,
        color: NAVY,
      });
    });
    this.y -= boxH + 16;
  }

  infoTable(pairs: [string, string][]) {
    const labelW = 158;
    const valueW = CONTENT_W - labelW;
    const size = 8.5;
    const pad = 7;

    this.ensure(22);
    this.drawHeaderBar(["Field", "Detail"], [MARGIN, MARGIN + labelW], [labelW, valueW], [false, false]);

    for (const [label, value] of pairs) {
      const labelLines = wrapToWidth(label, this.bold, size, labelW - pad * 2);
      const valueLines = wrapToWidth(value || "-", this.font, size, valueW - pad * 2);
      const lines = Math.max(labelLines.length, valueLines.length);
      const h = Math.max(20, lines * 11 + 10);
      this.ensure(h + 2);
      if (this.y - h < BOTTOM) {
        this.newPage();
        this.drawHeaderBar(["Field", "Detail"], [MARGIN, MARGIN + labelW], [labelW, valueW], [false, false]);
      }
      const bg = this.zebra ? ZEBRA : WHITE;
      this.zebra = !this.zebra;
      this.drawCells(
        this.y,
        h,
        [MARGIN, MARGIN + labelW],
        [labelW, valueW],
        [labelLines, valueLines],
        [this.bold, this.font],
        [false, false],
        bg,
        size
      );
      this.y -= h;
    }
    this.gap(14);
  }

  table(headers: string[], rows: PdfRow[], numeric?: boolean[]) {
    const colCount = headers.length;
    const firstW = colCount <= 2 ? Math.min(200, CONTENT_W * 0.4) : Math.min(206, CONTENT_W * 0.44);
    const restW = (CONTENT_W - firstW) / Math.max(1, colCount - 1);
    const widths = headers.map((_, i) => (i === 0 ? firstW : restW));
    const xs = widths.reduce<number[]>((acc, w, i) => {
      acc.push(i === 0 ? MARGIN : acc[i - 1] + widths[i - 1]);
      return acc;
    }, []);
    const alignRight = numeric ?? headers.map((_, i) => i > 0);
    const size = 8;

    this.ensure(24);
    this.drawHeaderBar(headers, xs, widths, alignRight);

    for (const row of rows) {
      const font = row.kind === "total" || row.kind === "section" ? this.bold : this.font;
      const wrapped = row.cells.map((cell, i) => {
        const indent = row.indent && i === 0 ? 10 : 0;
        return wrapToWidth(cell || (row.kind === "section" ? "" : "-"), font, size, widths[i] - 12 - indent);
      });
      const lineCount = Math.max(1, ...wrapped.map((lines) => lines.length));
      const h = Math.max(18, lineCount * 11 + 8);
      this.ensure(h + 2);
      if (this.y - h < BOTTOM) {
        this.newPage();
        this.drawHeaderBar(headers, xs, widths, alignRight);
      }
      const bg =
        row.kind === "section" ? SECTION_BG : row.kind === "total" ? TOTAL_BG : this.zebra ? ZEBRA : WHITE;
      if (row.kind !== "section") this.zebra = !this.zebra;
      const fonts = row.cells.map(() => font);
      const right = row.kind === "section" ? headers.map(() => false) : alignRight;
      this.drawCells(this.y, h, xs, widths, wrapped, fonts, right, bg, size, row.indent ? 10 : 0);
      this.y -= h;
    }
    this.gap(14);
  }

  private drawHeaderBar(headers: string[], xs: number[], widths: number[], alignRight: boolean[]) {
    const h = 18;
    this.ensure(h + 2);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - h,
      width: CONTENT_W,
      height: h,
      color: NAVY,
    });
    headers.forEach((header, i) => {
      const text = pdfSafe(header);
      const size = 7.5;
      const y = this.y - 12;
      if (alignRight[i]) {
        const tw = this.bold.widthOfTextAtSize(text, size);
        this.page.drawText(text, {
          x: xs[i] + widths[i] - 6 - tw,
          y,
          size,
          font: this.bold,
          color: WHITE,
        });
      } else {
        this.page.drawText(text, { x: xs[i] + 6, y, size, font: this.bold, color: WHITE });
      }
    });
    this.y -= h;
    this.zebra = false;
  }

  private drawCells(
    top: number,
    h: number,
    xs: number[],
    widths: number[],
    lines: string[][],
    fonts: PDFFont[],
    alignRight: boolean[],
    bg: RGB,
    size: number,
    indent = 0
  ) {
    this.page.drawRectangle({
      x: MARGIN,
      y: top - h,
      width: CONTENT_W,
      height: h,
      color: bg,
      borderColor: GRID,
      borderWidth: 0.4,
    });
    for (let i = 1; i < xs.length; i++) {
      this.page.drawLine({
        start: { x: xs[i], y: top },
        end: { x: xs[i], y: top - h },
        thickness: 0.4,
        color: GRID,
      });
    }
    lines.forEach((cellLines, i) => {
      cellLines.forEach((line, li) => {
        const y = top - 12 - li * 11;
        const extra = i === 0 ? indent : 0;
        if (alignRight[i]) {
          const tw = fonts[i].widthOfTextAtSize(line, size);
          this.page.drawText(line, {
            x: xs[i] + widths[i] - 6 - tw,
            y,
            size,
            font: fonts[i],
            color: TEXT,
          });
        } else {
          this.page.drawText(line, {
            x: xs[i] + 6 + extra,
            y,
            size,
            font: fonts[i],
            color: TEXT,
          });
        }
      });
    });
    this.page.drawLine({
      start: { x: MARGIN, y: top - h },
      end: { x: PAGE_W - MARGIN, y: top - h },
      thickness: 0.4,
      color: HAIR,
    });
  }

  async save() {
    return this.pdf.save();
  }
}

export async function generateListingDeskPdf(data: DeskListingPdfInput): Promise<Uint8Array> {
  const doc = await DeskPdfWriter.create(data.hashId);
  const historical = displayYearOrder(
    data.financials.filter((f) => String(f.kind) === "HISTORICAL").map(yearRecord)
  );
  const forecast = displayYearOrder(
    data.financials.filter((f) => String(f.kind) === "FORECAST").map(yearRecord)
  );
  const histYears = historical as Record<string, unknown>[];
  const forecastYears = forecast as Record<string, unknown>[];
  const status = data.status.replace(/_/g, " ");

  doc.identity(
    data.companyName || data.hashId,
    `${data.hashId}  ·  ${status}`,
    [
      ["Asking", data.dealTerms ? money(data.dealTerms.askingPriceNpr) : "On request"],
      ["Industry", industryLabel(data.industry)],
      ["Established", String(data.establishedYear || "-")],
    ]
  );

  doc.heading("Company");
  doc.infoTable([
    ["Reference", data.hashId],
    ["Status", status],
    ["Legal name", data.companyName || "-"],
    ["Seller", [data.sellerName, data.sellerEmail].filter(Boolean).join("  |  ") || "-"],
    ["Legal structure", legalStructureLabel(data.legalStructure)],
    ["Operating provinces", data.operatingProvinces.join(", ") || "-"],
    ["Head office", place(data.headOffice)],
    ["Plant / factory", place(data.plantLocation)],
    ...(data.reviewNotes ? ([["Desk notes", data.reviewNotes]] as [string, string][]) : []),
  ]);

  doc.heading("Sale terms");
  if (data.dealTerms) {
    doc.infoTable([
      ["Asking price", money(data.dealTerms.askingPriceNpr)],
      ["Modality", modalityLabel(data.dealTerms.modality)],
      ["Reason for exit", exitReasonLabel(data.dealTerms.exitReason)],
      ["Justification", data.dealTerms.valuationJustification || "-"],
    ]);
  } else {
    doc.note("Sale terms have not been entered.");
  }

  if (histYears.length) {
    const labels = histYears.map((y) => String(y.fiscalYearLabel || `Y${y.fiscalYear}`));
    doc.heading("Past 3 years (NPR)");
    doc.subheading("Balance sheet");
    doc.table(["Particulars", ...labels], statementRows(histYears, BS_LINES));
    doc.subheading("Profit & loss");
    doc.table(["Particulars", ...labels], statementRows(histYears, PL_LINES));
    doc.subheading("Cash flow");
    doc.table(["Particulars", ...labels], statementRows(histYears, CF_LINES));
  } else {
    doc.heading("Past 3 years (NPR)");
    doc.note("No historical years entered.");
  }

  if (forecastYears.length) {
    const labels = forecastYears.map((y) => String(y.fiscalYearLabel || `Y${y.fiscalYear}`));
    doc.heading("Next 3 years (NPR)");
    doc.subheading("Assumptions");
    doc.table(
      ["Particulars", ...labels],
      FORECAST_EXTRA_FIELDS.map((field) => ({
        cells: [
          field.label,
          ...forecastYears.map((y) => {
            const fromYear = y[field.key];
            if (fromYear != null && Number.isFinite(Number(fromYear))) {
              return field.key === "capex" ? money(fromYear) : `${Number(fromYear)}%`;
            }
            const extra = data.projections.find((p) => p.year === Number(y.fiscalYear));
            if (!extra) return "-";
            return field.key === "capex" ? money(extra.capex) : `${Number(extra[field.key] ?? 0)}%`;
          }),
        ],
      }))
    );
    if (data.strategicAssumptions) {
      doc.infoTable([["Strategic assumptions", data.strategicAssumptions]]);
    }
    doc.subheading("Balance sheet");
    doc.table(["Particulars", ...labels], statementRows(forecastYears, BS_LINES));
    doc.subheading("Profit & loss");
    doc.table(["Particulars", ...labels], statementRows(forecastYears, PL_LINES));
    doc.subheading("Cash flow");
    doc.table(["Particulars", ...labels], statementRows(forecastYears, CF_LINES));
  } else {
    doc.heading("Next 3 years (NPR)");
    doc.note("No forecast years entered.");
    if (data.strategicAssumptions) {
      doc.infoTable([["Strategic assumptions", data.strategicAssumptions]]);
    }
  }

  if (data.assetRevaluations.length) {
    doc.heading("Asset revaluation adjustments");
    doc.table(
      ["Particulars", "Book value", "Realisable", "Net"],
      data.assetRevaluations.map((row) => {
        const book = Number(row.bookValue ?? 0);
        const market = Number(row.marketValue ?? 0);
        const label =
          REVALUATION_ASSET_LABELS[row.assetType as keyof typeof REVALUATION_ASSET_LABELS] ??
          row.assetType.replace(/_/g, " ");
        return { cells: [label, money(book), money(market), money(market - book)] };
      })
    );
    const notes = data.assetRevaluations
      .filter((row) => row.notes?.trim())
      .map((row) => {
        const label =
          REVALUATION_ASSET_LABELS[row.assetType as keyof typeof REVALUATION_ASSET_LABELS] ?? row.assetType;
        return [label, row.notes!.trim()] as [string, string];
      });
    if (notes.length) doc.infoTable(notes);
  }

  if (data.complianceRecords.length || data.ipAssets.length) {
    doc.heading("Licenses and IP");
    if (data.complianceRecords.length) {
      doc.table(
        ["Authority", "Status", "Upto", "ID / remarks"],
        data.complianceRecords.map((row) => ({
          cells: [
            authorityLabel(row.authority),
            row.status.replace(/_/g, " "),
            row.lastClearanceYear ? String(row.lastClearanceYear) : "-",
            [row.identifier, row.remarks, row.outstandingDisputes].filter(Boolean).join(" / ") || "-",
          ],
        })),
        [false, false, false, false]
      );
    }
    if (data.ipAssets.length) {
      doc.table(
        ["IP type", "Reference"],
        data.ipAssets.map((ip) => ({
          cells: [ip.type.replace(/_/g, " "), ip.reference],
        })),
        [false, false]
      );
    }
  }

  doc.heading("Team, risk, and capacity");
  if (data.humanCapital) {
    doc.subheading("Team");
    doc.table(
      ["Role", "Count"],
      [
        { cells: ["Management staff", String(data.humanCapital.managementCount)] },
        { cells: ["Technical staff", String(data.humanCapital.technicalCount)] },
        { cells: ["General staff", String(data.humanCapital.generalCount)] },
        { cells: ["SSF compliant", data.humanCapital.ssfCompliant ? "Yes" : "No"], kind: "total" },
      ],
      [false, true]
    );
  }
  if (data.riskLog) {
    doc.subheading("Risk");
    doc.infoTable([
      ["Outstanding debt", money(data.riskLog.outstandingDebt)],
      ["Asset encumbrances", data.riskLog.assetEncumbrances || "-"],
      ["Bank collateral", data.riskLog.bankCollateralTies || "-"],
      ["Pending litigations", data.riskLog.pendingLitigations || "-"],
    ]);
  }
  if (data.capacityMetrics) {
    const unit = data.capacityMetrics.capacityUnit || "";
    doc.subheading("Capacity");
    doc.table(
      ["Metric", "Value"],
      [
        { cells: ["Running output", `${Number(data.capacityMetrics.runningOutput ?? 0)} ${unit}`.trim()] },
        { cells: ["Installed peak", `${Number(data.capacityMetrics.installedPeak ?? 0)} ${unit}`.trim()] },
        {
          cells: [
            "Utilization",
            data.capacityMetrics.utilizationPct != null ? `${Number(data.capacityMetrics.utilizationPct)}%` : "-",
          ],
          kind: "total",
        },
      ],
      [false, true]
    );
  }

  if (data.documents.length) {
    doc.heading("Attachments");
    doc.table(
      ["Type", "File"],
      data.documents.map((docRow) => ({
        cells: [docRow.type.replace(/_/g, " "), docRow.label || fileName(docRow.s3Key) || "Uploaded file"],
      })),
      [false, false]
    );
  }

  doc.note("This file is for the ASAR deal desk only. Do not forward the legal name or line-item books.");
  return doc.save();
}
