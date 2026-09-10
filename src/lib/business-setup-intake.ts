import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { checkInvestmentTotals } from "@/lib/rules/startABusiness";

const shareholderSchema = z
  .object({
    category: z.enum(["NEPALI_CITIZEN", "FOREIGN_CITIZEN", "NEPALI_ENTITY", "FOREIGN_ENTITY", "PUBLIC"]),
    promoterCount: z.number().int().min(0),
    committedCapital: z.number().min(0),
  })
  .refine((s) => s.category === "PUBLIC" || s.promoterCount >= 1, {
    message: "Each shareholder category needs at least 1 promoter.",
    path: ["promoterCount"],
  });

const addressSchema = z.object({
  kind: z.enum(["HEAD_OFFICE", "BRANCH", "FACTORY", "GODOWN", "STORE"]),
  district: z.string().min(1),
  localBody: z.string().min(1),
});

const internationalPhone = z
  .string()
  .trim()
  .refine((value) => normalizePhone(value) !== null, {
    message: "Enter a valid phone number with country code (e.g. +977… or +1…).",
  })
  .transform((value) => normalizePhone(value)!);

export const businessSetupIntakeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contactName: z.string().trim().min(2).max(60),
  phone: internationalPhone,
  email: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  objective: z.enum(["MANUFACTURING", "TRADING", "SERVICE"]),
  businessType: z.enum(["PRIVATE_LIMITED", "PUBLIC_LIMITED", "PROPRIETORSHIP", "PARTNERSHIP"]),
  fdiRequested: z.boolean(),
  sectorTags: z.array(z.string()).default([]),
  fdiNegativeCodes: z.array(z.string()).default([]),
  addresses: z.array(addressSchema).min(1),
  equityInvestment: z.number().min(0),
  loanInvestment: z.number().min(0),
  fixedAssets: z.number().min(0),
  plantMachineryCost: z.number().min(0),
  netCurrentAssets: z.number().min(0),
  shareholders: z.array(shareholderSchema).min(1),
  sizeCategory: z.enum(["MICRO", "COTTAGE", "SMALL", "MEDIUM", "LARGE"]),
  objectiveCategory: z.enum([
    "ENERGY",
    "MANUFACTURING",
    "AGRICULTURE_FOREST",
    "MINERAL",
    "INFRASTRUCTURE",
    "TOURISM",
    "ICT",
    "SERVICE",
    "TRADING",
  ]),
  licenseIndustries: z.array(z.string()).default([]),
  ieeEiaCriterionId: z.string().nullable().optional(),
  ieeEiaLevel: z.enum(["NONE", "BRIEF", "IEE", "EIA"]).optional(),
  /** Honeypot — must stay empty */
  website: z.string().optional(),
}).superRefine((data, ctx) => {
  for (const issue of checkInvestmentTotals(
    {
      equityInvestment: data.equityInvestment,
      loanInvestment: data.loanInvestment,
      fixedAssets: data.fixedAssets,
      plantMachineryCost: data.plantMachineryCost,
      netCurrentAssets: data.netCurrentAssets,
    },
    data.objective
  )) {
    if (issue.severity !== "BLOCKER") continue;
    const path =
      issue.code === "INVESTMENT-MFG-MACHINERY"
        ? ["plantMachineryCost"]
        : issue.code === "INVESTMENT-MFG-REQUIRED"
          ? ["equityInvestment"]
          : ["fixedAssets"];
    ctx.addIssue({ code: "custom", message: issue.message, path });
  }
});
