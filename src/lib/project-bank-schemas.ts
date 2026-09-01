import { z } from "zod";
import {
  CapexRange,
  FundingStage,
  InvestmentTimeframe,
  InvestorType,
} from "@prisma/client";
import { PROJECT_SECTOR_VALUES } from "@/types/project-bank";

export const useOfFundsSchema = z
  .array(
    z.object({
      category: z.string().trim().min(1).max(80),
      percentage: z.number().min(0).max(100),
    })
  )
  .max(6)
  .refine((rows) => rows.length === 0 || Math.abs(rows.reduce((sum, row) => sum + row.percentage, 0) - 100) < 0.51, {
    message: "Use of funds must add up to 100%.",
  });

export const vaultSchema = z.object({
  exactAddress: z.string().trim().min(8, "Enter at least 8 characters.").max(240),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  founderFullName: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  founderEmail: z.string().email("Enter a valid email.").optional().or(z.literal("")),
  founderPhone: z
    .string()
    .trim()
    .regex(/^(97|98)\d{8}$/, "Enter a 10-digit Nepal mobile starting with 97 or 98."),
  companyName: z.string().trim().max(160).optional(),
  registrationStatus: z.string().trim().max(160).optional(),
  detailedBreakdown: z.string().trim().max(8000).optional(),
  competitiveMoat: z.string().trim().max(4000).optional(),
  prototypeUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  financialModelS3Key: z.string().max(512).optional(),
  bootstrapCapitalInvested: z.number().min(0).optional(),
  useOfFunds: useOfFundsSchema.optional(),
  permitsStatus: z.string().trim().max(4000).optional(),
  keyRisks: z.string().trim().max(4000).optional(),
  fullPitchDeckS3Key: z.string().max(512).optional(),
});

export const teaserSchema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(140),
  sector: z.enum(PROJECT_SECTOR_VALUES),
  broadRegion: z.string().min(2, "Choose a broad region.").max(80),
  elevatorPitch: z
    .string()
    .trim()
    .min(20, "Write 2–3 sentences.")
    .max(500, "Keep the pitch to 2–3 sentences (500 characters max)."),
  capexRange: z.nativeEnum(CapexRange),
  targetRoiIrr: z
    .string()
    .trim()
    .min(1, "Enter a return, e.g. 18.")
    .max(80),
  fundingStage: z.nativeEnum(FundingStage),
  capitalSought: z.number().min(0).optional(),
  visualAssetKeys: z
    .array(z.string())
    .min(1, "Add 1–2 concept images.")
    .max(2, "You can upload up to 2 images."),
});

const FIELD_LABELS: Record<string, string> = {
  title: "Project title",
  sector: "Sector",
  broadRegion: "Location",
  elevatorPitch: "Elevator pitch",
  capexRange: "Estimated CAPEX",
  targetRoiIrr: "Target IRR",
  fundingStage: "Funding stage",
  visualAssetKeys: "Visual assets",
  "vault.exactAddress": "Real location",
  "vault.founderFullName": "Name",
  "vault.founderPhone": "WhatsApp / call",
  "teaser.title": "Project title",
  "teaser.targetRoiIrr": "Target IRR",
  "teaser.elevatorPitch": "Elevator pitch",
  "teaser.broadRegion": "Location",
};

export function formatZodError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Please check the form and try again.";
  const path = issue.path.join(".");
  const label = FIELD_LABELS[path];
  if (label) return `${label}: ${issue.message}`;
  return issue.message;
}

export const projectCreateSchema = teaserSchema.extend({
  elevatorPitch: z
    .string()
    .trim()
    .min(40, "Write 2–3 sentences (40–500 characters).")
    .max(500, "Keep the pitch to 2–3 sentences (500 characters max)."),
  targetRoiIrr: z
    .string()
    .trim()
    .regex(/^\d{1,2}(\.\d{1,2})?(\s*[–-]\s*\d{1,2}(\.\d{1,2})?)?%?$/, "Enter a return like 18 or 15–18.")
    .max(80),
  vault: vaultSchema,
});

export const INVESTOR_PHONE = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^[+\d][\d\s\-()]{6,19}$/, "Enter a valid phone or WhatsApp number.");

export const leadInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  firm: z.string().trim().min(2).max(160),
  email: z.string().email(),
  phone: INVESTOR_PHONE,
  investorType: z.nativeEnum(InvestorType),
  investmentTimeframe: z.nativeEnum(InvestmentTimeframe),
});
