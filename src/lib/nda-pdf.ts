import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface NdaPdfData {
  referenceId: string;
  referenceLabel?: string;
  buyerName: string;
  buyerEmail: string;
  signedAt: Date;
  ipAddress?: string | null;
}

/** @deprecated use referenceId — kept for listing call sites */
export interface ListingNdaPdfData extends NdaPdfData {
  hashId: string;
}

export async function generateNdaPdf(data: NdaPdfData | ListingNdaPdfData): Promise<Uint8Array> {
  const refId = "hashId" in data && data.hashId ? data.hashId : data.referenceId;
  const refLabel = data.referenceLabel ?? "Listing reference";
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = rgb(0.05, 0.2, 0.35);
  const muted = rgb(0.4, 0.4, 0.4);

  let y = 780;
  page.drawText("SARA ADVISORS", { x: 50, y, size: 12, font: bold, color: brand });
  page.drawText("Non-Disclosure Agreement", { x: 50, y: y - 20, size: 18, font: bold });
  page.drawText(`${refLabel}: ${refId}`, { x: 50, y: y - 42, size: 10, font, color: muted });

  y -= 80;
  const body = [
    `This Non-Disclosure Agreement ("NDA") is executed digitally between SARA Advisors and`,
    `${data.buyerName} (${data.buyerEmail}) on ${data.signedAt.toISOString().slice(0, 10)}.`,
    "",
    "The Recipient agrees to keep confidential all information disclosed regarding the business",
    "opportunity referenced above, including financial statements, asset valuations, regulatory",
    "attachments, and operational data. The Recipient shall not disclose, copy, or use this",
    "information for any purpose other than evaluating a potential transaction facilitated by",
    "SARA Advisors.",
    "",
    "This agreement remains binding for 24 months from the date of execution. Breach may result",
    "in injunctive relief and liability for damages under applicable law.",
    "",
    data.ipAddress ? `Executed from IP: ${data.ipAddress}` : "",
  ].filter(Boolean);

  for (const line of body) {
    page.drawText(line, { x: 50, y, size: 10, font, maxWidth: 495 });
    y -= line === "" ? 10 : 16;
  }

  y -= 20;
  page.drawText("Digitally accepted via SARA Advisors platform.", { x: 50, y, size: 9, font: bold, color: brand });

  return pdf.save();
}
