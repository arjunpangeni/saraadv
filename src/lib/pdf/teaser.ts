import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatNpr } from "@/lib/calc";


export interface TeaserData {
  hashId: string;
  industry: string;
  legalStructure: string;
  establishedYear: number;
  province: string;
  district: string;
  askingPriceNpr: number;
  modality: string;
  exitReason: string;
  valuationJustification: string;
  licensedCapacity: string;
  largestTurnoverNpr: number;
  balanceSheetSizeNpr: number;
  latestFiscalYear: {
    revenue: number;
    ebitda: number;
    npat: number;
  };
  utilizationPct?: number;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export async function generateTeaserPdf(data: TeaserData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = 780;

  const brand = rgb(0.05, 0.2, 0.35);
  const muted = rgb(0.4, 0.4, 0.4);

  page.drawText("SARA ADVISORS", { x: margin, y, size: 12, font: bold, color: brand });
  page.drawText("Investment Teaser", { x: margin, y: y - 16, size: 20, font: bold });
  page.drawText("Confidential - Anonymized Summary", {
    x: margin,
    y: y - 36,
    size: 10,
    font,
    color: muted,
  });

  y -= 70;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  y -= 30;
  const rows: [string, string][] = [
    ["Reference ID", data.hashId],
    ["Sector", data.industry],
    ["Legal Structure", data.legalStructure],
    ["Established", String(data.establishedYear)],
    ["Location", `${data.district}, ${data.province}`],
    ["Capacity as per license", data.licensedCapacity || "—"],
    ["Largest turnover (3 yrs)", data.largestTurnoverNpr ? formatNpr(data.largestTurnoverNpr) : "—"],
    ["Audited BS size", data.balanceSheetSizeNpr ? formatNpr(data.balanceSheetSizeNpr) : "—"],
    ["Proposed sale value", formatNpr(data.askingPriceNpr)],
    ["Transaction modality", data.modality],
    ["Reason for exit", data.exitReason],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: margin, y, size: 11, font: bold });
    page.drawText(value.slice(0, 50), { x: margin + 200, y, size: 11, font });
    y -= 20;
  }

  y -= 8;
  page.drawText("Justification of sale value", { x: margin, y, size: 11, font: bold });
  y -= 16;
  for (const line of wrapText(data.valuationJustification || "—", 80)) {
    page.drawText(line, { x: margin, y, size: 10, font });
    y -= 14;
  }

  y -= 12;
  page.drawText("Financial Snapshot (Latest Fiscal Year)", { x: margin, y, size: 13, font: bold, color: brand });
  y -= 24;

  const finRows: [string, string][] = [
    ["Revenue", formatNpr(data.latestFiscalYear.revenue)],
    ["EBITDA", formatNpr(data.latestFiscalYear.ebitda)],
    ["Net Profit After Tax", formatNpr(data.latestFiscalYear.npat)],
  ];
  if (typeof data.utilizationPct === "number") {
    finRows.push(["Plant Capacity Utilization", `${data.utilizationPct}%`]);
  }

  for (const [label, value] of finRows) {
    page.drawText(label, { x: margin, y, size: 11, font: bold });
    page.drawText(value, { x: margin + 200, y, size: 11, font });
    y -= 20;
  }

  y -= 24;
  page.drawText(
    "This teaser is anonymized. Full financials, asset revaluations and regulatory",
    { x: margin, y, size: 9, font, color: muted }
  );
  y -= 12;
  page.drawText(
    "attachments are available to verified investors after executing a binding NDA.",
    { x: margin, y, size: 9, font, color: muted }
  );

  page.drawText("Request Full Profile & Get Quote for SARA M&A Services", {
    x: margin,
    y: 60,
    size: 10,
    font: bold,
    color: brand,
  });

  return pdf.save();
}
