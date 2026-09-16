"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SmoothButton from "@/components/smoothui/smooth-button";
import { FormError } from "@/components/ui/status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { Card, CardContent } from "@/components/ui/card";
import { WizardSteps } from "@/components/console/wizard-steps";
import {
  LICENSE_NEEDED_INDUSTRIES,
  MIN_FDI_CAPITAL_NPR,
  FDI_NEGATIVE_LIST,
  INDUSTRY_SIZE_GUIDE,
  COTTAGE_ACTIVITIES,
  capitalSizeBracket,
  checkIndustrySizeClassification,
  industrySizeChecklist,
  fixedCapitalNpr,
  evaluateEligibility,
  type EligibilityIssue,
  type IndustrySizeCategory,
  type IndustrySizeFacts,
  type StartABusinessInput,
} from "@/lib/rules/startABusiness";
import { formatNpr } from "@/lib/calc";
import { saveGuidePayload, type SetupGuidePayload } from "@/lib/start-a-business-guide";
import {
  NEPAL_DISTRICTS,
  NEPAL_PROVINCES,
  districtsInProvince,
  isValidEmail,
  localBodiesInDistrict,
  nonNegativeAmount,
  promoterCountValue,
  provinceOfDistrict,
} from "@/lib/nepal-locations";
import { normalizePhone, sanitizePhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const WIZARD_PATH = "/start-a-business/wizard";
export const DRAFT_KEY = "asar:business-setup-draft-v3";

export const CONTACT_NAME_MAX = 60;
export const BUSINESS_NAME_MAX = 80;

const STEP_HEADING =
  "heading-soft mb-2 font-heading text-base font-semibold tracking-[-0.015em] text-foreground sm:text-lg";
const STEP_COPY = "mb-3 text-sm leading-relaxed text-muted-foreground sm:text-[1.05rem] sm:leading-[1.7]";

const STEPS = [
  "Basic details",
  "Addresses",
  "Objective category",
  "Investment",
  "Proposed application",
  "Shareholders",
  "Industry size",
  "Licensing",
  "Environment",
  "Review",
];

const TYPE_LABEL: Record<string, string> = {
  PRIVATE_LIMITED: "Private Limited",
  PUBLIC_LIMITED: "Public Limited",
  PROPRIETORSHIP: "Proprietorship",
  PARTNERSHIP: "Partnership",
};

const SHAREHOLDER_LABEL: Record<string, string> = {
  NEPALI_CITIZEN: "Nepali Citizen",
  FOREIGN_CITIZEN: "Foreign Citizen",
  NEPALI_ENTITY: "Nepali Entity",
  FOREIGN_ENTITY: "Foreign Entity",
  PUBLIC: "General Public / Secondary Market",
};

const SHAREHOLDER_CATEGORY_OPTIONS = [
  { value: "NEPALI_CITIZEN", label: "Nepali Citizen" },
  { value: "FOREIGN_CITIZEN", label: "Foreign Citizen" },
  { value: "NEPALI_ENTITY", label: "Nepali Entity" },
  { value: "FOREIGN_ENTITY", label: "Foreign Entity" },
  { value: "PUBLIC", label: "General Public / Secondary Market" },
] as const;

/** Each category may appear on only one row; counts go in that row's promoter field. */
function shareholderCategoryOptions(shareholders: ShareholderRow[], idx: number) {
  const usedElsewhere = new Set(
    shareholders.filter((_, i) => i !== idx).map((row) => row.category)
  );
  return SHAREHOLDER_CATEGORY_OPTIONS.filter(
    (opt) => !usedElsewhere.has(opt.value) || shareholders[idx]?.category === opt.value
  );
}

function nextShareholderCategory(shareholders: ShareholderRow[]) {
  const used = new Set(shareholders.map((s) => s.category));
  return SHAREHOLDER_CATEGORY_OPTIONS.find((opt) => !used.has(opt.value))?.value ?? null;
}

const ADDRESS_KIND_LABEL: Record<string, string> = {
  HEAD_OFFICE: "Head Office",
  BRANCH: "Branch",
  FACTORY: "Factory",
  GODOWN: "Godown",
  STORE: "Store",
};

export interface AddressRow {
  kind: "HEAD_OFFICE" | "BRANCH" | "FACTORY" | "GODOWN" | "STORE";
  province: string;
  district: string;
  localBody: string;
}

export interface ShareholderRow {
  category: string;
  promoterCount: string;
  committedCapital: string;
}

export interface WizardFormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  objective: string;
  businessType: string;
  fdiRequested: boolean;
  addresses: AddressRow[];
  equityInvestment: string;
  loanInvestment: string;
  fixedAssets: string;
  plantMachineryCost: string;
  netCurrentAssets: string;
  sizeCategory: string;
  ownerOperated: boolean;
  workerCount: string;
  annualTurnover: string;
  powerKw: string;
  cottageActivityConfirmed: boolean;
  objectiveCategory: string;
  licenseIndustries: string[];
  fdiNegativeCodes: string[];
  ieeEiaCriterionId: string;
}

export const INITIAL_FORM: WizardFormState = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  objective: "SERVICE",
  businessType: "PRIVATE_LIMITED",
  fdiRequested: false,
  addresses: [{ kind: "HEAD_OFFICE", province: "", district: "", localBody: "" }],
  equityInvestment: "",
  loanInvestment: "",
  fixedAssets: "",
  plantMachineryCost: "",
  netCurrentAssets: "",
  sizeCategory: "SMALL",
  ownerOperated: false,
  workerCount: "",
  annualTurnover: "",
  powerKw: "",
  cottageActivityConfirmed: false,
  objectiveCategory: "SERVICE",
  licenseIndustries: [],
  fdiNegativeCodes: [],
  ieeEiaCriterionId: "",
};

export const INITIAL_SHAREHOLDERS: ShareholderRow[] = [
  { category: "NEPALI_CITIZEN", promoterCount: "1", committedCapital: "" },
];

interface IeeCriterion {
  id: string;
  sector: string;
  scope: string;
  level: string;
}

function normalizeAddress(raw: Partial<AddressRow> & { kind?: AddressRow["kind"] }): AddressRow {
  const district = raw.district ?? "";
  const province = raw.province || provinceOfDistrict(district);
  return {
    kind: raw.kind ?? "BRANCH",
    province,
    district,
    localBody: raw.localBody ?? "",
  };
}

function saveDraft(
  form: WizardFormState,
  shareholders: ShareholderRow[],
  step: number,
  maxReachedStep: number
) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, shareholders, step, maxReachedStep }));
  } catch {
    // ignore
  }
}

function loadDraft(): {
  form: WizardFormState;
  shareholders: ShareholderRow[];
  step: number;
  maxReachedStep: number;
} | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      form?: WizardFormState;
      shareholders?: ShareholderRow[];
      step?: number;
      maxReachedStep?: number;
    };
    if (!parsed.form || !Array.isArray(parsed.shareholders)) return null;
    const addresses = (parsed.form.addresses ?? INITIAL_FORM.addresses).map((a) =>
      normalizeAddress(a)
    );
    const step = typeof parsed.step === "number" ? parsed.step : 0;
    const maxReachedStep =
      typeof parsed.maxReachedStep === "number"
        ? Math.max(parsed.maxReachedStep, step)
        : step;
    return {
      form: {
        ...INITIAL_FORM,
        ...parsed.form,
        addresses,
        fdiNegativeCodes: parsed.form.fdiNegativeCodes ?? [],
      },
      shareholders: parsed.shareholders.length > 0 ? parsed.shareholders : INITIAL_SHAREHOLDERS,
      step,
      maxReachedStep,
    };
  } catch {
    return null;
  }
}

export function clearBusinessSetupDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

function buildPayload(form: WizardFormState, shareholders: ShareholderRow[]) {
  return {
    name: form.name.trim(),
    contactName: form.contactName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase(),
    objective: form.objective,
    businessType: form.businessType,
    fdiRequested: form.fdiRequested,
    sectorTags: [],
    sizeCategory: form.sizeCategory,
    objectiveCategory: form.objectiveCategory,
    licenseIndustries: form.licenseIndustries,
    fdiNegativeCodes: form.fdiRequested ? form.fdiNegativeCodes : [],
    equityInvestment: Number(form.equityInvestment || 0),
    loanInvestment: Number(form.loanInvestment || 0),
    fixedAssets: Number(form.fixedAssets || 0),
    plantMachineryCost: Number(form.plantMachineryCost || 0),
    netCurrentAssets: Number(form.netCurrentAssets || 0),
    addresses: form.addresses
      .filter((a) => a.district.trim() && a.localBody.trim())
      .map((a) => ({
        kind: a.kind,
        district: a.district.trim(),
        localBody: a.localBody.trim(),
      })),
    shareholders: shareholders.map((s) => ({
      category: s.category,
      promoterCount: Number(s.promoterCount || (s.category === "PUBLIC" ? 0 : 1)),
      committedCapital: Number(s.committedCapital || 0),
    })),
    ieeEiaCriterionId: form.ieeEiaCriterionId || null,
    ieeEiaLevel: form.ieeEiaCriterionId ? undefined : ("NONE" as const),
    website: "",
  };
}

function engineInputFromForm(form: WizardFormState, shareholders: ShareholderRow[]): StartABusinessInput {
  return {
    objective: form.objective as StartABusinessInput["objective"],
    businessType: form.businessType as StartABusinessInput["businessType"],
    fdiRequested: form.fdiRequested,
    sectorTags: [],
    shareholders: shareholders.map((s) => ({
      category: s.category,
      promoterCount: Number(s.promoterCount || (s.category === "PUBLIC" ? 0 : 1)),
      committedCapital: Number(s.committedCapital || 0),
    })),
    investment: {
      equityInvestment: Number(form.equityInvestment || 0),
      loanInvestment: Number(form.loanInvestment || 0),
    },
    sizeCategory: form.sizeCategory as StartABusinessInput["sizeCategory"],
    objectiveCategory: form.objectiveCategory as StartABusinessInput["objectiveCategory"],
    licenseRequired: form.licenseIndustries.length > 0,
    fdiNegativeCodes: form.fdiRequested ? form.fdiNegativeCodes : [],
  };
}

function sizeFactsFromForm(form: WizardFormState): IndustrySizeFacts {
  return {
    sizeCategory: form.sizeCategory as IndustrySizeCategory,
    fixedAssets: Number(form.fixedAssets || 0),
    plantMachineryCost: Number(form.plantMachineryCost || 0),
    ownerOperated: form.ownerOperated,
    workerCount: Number(form.workerCount || 0),
    annualTurnover: Number(form.annualTurnover || 0),
    powerKw: form.powerKw === "" ? Number.NaN : Number(form.powerKw),
    cottageActivityConfirmed: form.cottageActivityConfirmed,
  };
}

function eligibilityIssues(form: WizardFormState, shareholders: ShareholderRow[]): EligibilityIssue[] {
  return evaluateEligibility(engineInputFromForm(form, shareholders), FDI_NEGATIVE_LIST, {
    equityInvestment: Number(form.equityInvestment || 0),
    loanInvestment: Number(form.loanInvestment || 0),
    fixedAssets: Number(form.fixedAssets || 0),
    plantMachineryCost: Number(form.plantMachineryCost || 0),
    netCurrentAssets: Number(form.netCurrentAssets || 0),
  });
}

function investmentBlockers(form: WizardFormState, shareholders: ShareholderRow[]): EligibilityIssue[] {
  return eligibilityIssues(form, shareholders).filter(
    (i) =>
      i.severity === "BLOCKER" &&
      (i.code === "INVESTMENT-TOTAL-MISMATCH" ||
        i.code === "INVESTMENT-MFG-REQUIRED" ||
        i.code === "INVESTMENT-MFG-MACHINERY")
  );
}

function promoterMin(category: string) {
  return category === "PUBLIC" ? 0 : 1;
}

function filterIeeCriteria(list: IeeCriterion[], sector: string, query: string): IeeCriterion[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((item) => {
    if (sector && item.sector !== sector) return false;
    if (words.length === 0) return true;
    const hay = `${item.sector} ${item.scope} ${item.level}`.toLowerCase();
    return words.every((word) => hay.includes(word));
  });
}

function localBodyOptions(district: string, current: string) {
  const listed = localBodiesInDistrict(district);
  const options = listed.map((name) => ({ value: name, label: name }));
  if (current && !listed.includes(current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
}

function districtOptions(province: string, current: string) {
  const listed = province ? districtsInProvince(province) : NEPAL_DISTRICTS;
  const options = listed.map((name) => ({ value: name, label: name }));
  if (current && !listed.includes(current)) {
    options.unshift({ value: current, label: current });
  }
  return options;
}

function prettyLabel(value: string) {
  return value.replace(/_/g, " ");
}

const OBJECTIVE_VALUES = ["MANUFACTURING", "TRADING", "SERVICE"] as const;
const BUSINESS_TYPE_VALUES = ["PRIVATE_LIMITED", "PUBLIC_LIMITED", "PROPRIETORSHIP", "PARTNERSHIP"] as const;
const SIZE_VALUES = ["MICRO", "COTTAGE", "SMALL", "MEDIUM", "LARGE"] as const;
const OBJECTIVE_CATEGORY_VALUES = [
  "ENERGY",
  "MANUFACTURING",
  "AGRICULTURE_FOREST",
  "MINERAL",
  "INFRASTRUCTURE",
  "TOURISM",
  "ICT",
  "SERVICE",
  "TRADING",
] as const;

function isAllowed<T extends string>(value: string, allowed: readonly T[]): boolean {
  return (allowed as readonly string[]).includes(value);
}

const INTAKE_FIELD_META: Record<string, { label: string; step: number }> = {
  name: { label: "Business name", step: 0 },
  contactName: { label: "Your name", step: 0 },
  phone: { label: "Contact number", step: 0 },
  email: { label: "Email", step: 0 },
  objective: { label: "Objective", step: 0 },
  businessType: { label: "Type of business", step: 0 },
  fdiRequested: { label: "FDI", step: 0 },
  fdiNegativeCodes: { label: "FDI negative list", step: 0 },
  addresses: { label: "Addresses", step: 1 },
  objectiveCategory: { label: "Industry objective category", step: 2 },
  equityInvestment: { label: "Equity investment", step: 3 },
  loanInvestment: { label: "Loan investment", step: 3 },
  fixedAssets: { label: "Fixed assets", step: 4 },
  plantMachineryCost: { label: "Plant & machinery cost", step: 4 },
  netCurrentAssets: { label: "Net current assets", step: 4 },
  shareholders: { label: "Shareholders", step: 5 },
  sizeCategory: { label: "Industry size", step: 6 },
  ownerOperated: { label: "Owner-operated (Micro)", step: 6 },
  workerCount: { label: "Number of workers (Micro)", step: 6 },
  annualTurnover: { label: "Annual turnover (Micro)", step: 6 },
  powerKw: { label: "Power use (kW)", step: 6 },
  cottageActivityConfirmed: { label: "Cottage activity confirmation", step: 6 },
  licenseIndustries: { label: "License-needed industry", step: 7 },
  ieeEiaCriterionId: { label: "IEE / EIA screening", step: 8 },
  ieeEiaLevel: { label: "IEE / EIA screening", step: 8 },
};

function rootFieldKey(path: string) {
  return path.split(/[.\[]/)[0] ?? path;
}

function humanizeFieldMessage(label: string, raw: string) {
  if (
    !raw ||
    /invalid (option|enum|literal|type|input|value)/i.test(raw) ||
    /^(required|invalid)$/i.test(raw) ||
    /expected/i.test(raw)
  ) {
    return `${label} is required.`;
  }
  return raw;
}

function parseIntakeError(error: unknown): { message: string; step: number } | null {
  if (typeof error === "string" && error.trim()) {
    return { message: error, step: 9 };
  }
  if (!error || typeof error !== "object") return null;

  const record = error as { fieldErrors?: Record<string, unknown>; formErrors?: unknown };
  const lines: string[] = [];
  let firstStep = 9;

  if (record.fieldErrors && typeof record.fieldErrors === "object") {
    for (const [rawKey, rawMsgs] of Object.entries(record.fieldErrors)) {
      const msgs = Array.isArray(rawMsgs)
        ? rawMsgs.filter((item): item is string => typeof item === "string" && item.length > 0)
        : [];
      if (msgs.length === 0) continue;
      const meta = INTAKE_FIELD_META[rootFieldKey(rawKey)] ?? {
        label: prettyLabel(rootFieldKey(rawKey)),
        step: 9,
      };
      lines.push(humanizeFieldMessage(meta.label, msgs[0]));
      firstStep = Math.min(firstStep, meta.step);
    }
  }

  if (Array.isArray(record.formErrors)) {
    for (const item of record.formErrors) {
      if (typeof item === "string" && item.trim()) lines.push(item);
    }
  }

  if (lines.length === 0) return null;
  const unique = [...new Set(lines)];
  return {
    message: unique.length === 1 ? unique[0] : `Fix these before submitting: ${unique.join(" ")}`,
    step: firstStep,
  };
}

export function BusinessSetupWizardForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [shareholders, setShareholders] = useState<ShareholderRow[]>(INITIAL_SHAREHOLDERS);
  const [criteria, setCriteria] = useState<IeeCriterion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [ieeSector, setIeeSector] = useState("");
  const [ieeQuery, setIeeQuery] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldScrollOnStep = useRef(false);

  function scrollWizardIntoView() {
    const node = cardRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  useEffect(() => {
    if (!shouldScrollOnStep.current) return;
    shouldScrollOnStep.current = false;
    scrollWizardIntoView();
  }, [step]);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setForm(draft.form);
      setShareholders(draft.shareholders);
      setStep(draft.step);
      setMaxReachedStep(draft.maxReachedStep);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    setMaxReachedStep((prev) => Math.max(prev, step));
  }, [step]);

  useEffect(() => {
    if (!ready) return;
    const node = cardRef.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top;
    if (top >= 96 && top <= window.innerHeight * 0.42) return;
    scrollWizardIntoView();
  }, [ready]);

  useEffect(() => {
    fetch("/api/business-setup/iee-eia-criteria")
      .then((r) => r.json())
      .then((d) => setCriteria(d.criteria ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => saveDraft(form, shareholders, step, maxReachedStep), 400);
    return () => clearTimeout(t);
  }, [ready, form, shareholders, step, maxReachedStep]);

  const submitIntake = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/business-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(form, shareholders)),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.blockers) && data.blockers.length > 0) {
        const message = data.blockers.map((b: EligibilityIssue) => b.message).join(" ");
        setError(message);
        toast.error("This setup is not eligible under current rules.");
        return false;
      }
      const parsed = parseIntakeError(data.error);
      const message = parsed?.message ?? "Unable to submit your inquiry. Please check your inputs.";
      setError(message);
      toast.error(message);
      if (parsed && parsed.step < STEPS.length - 1) {
        shouldScrollOnStep.current = true;
        setStep(parsed.step);
      }
      return false;
    }

    const data = await res.json().catch(() => ({}));
    if (data.guide) {
      saveGuidePayload(data.guide as SetupGuidePayload);
    }
    clearBusinessSetupDraft();
    router.push("/start-a-business/guide");
    return true;
  }, [form, shareholders, router]);

  function toggleNegative(code: string) {
    setForm((prev) => ({
      ...prev,
      fdiNegativeCodes: prev.fdiNegativeCodes.includes(code)
        ? prev.fdiNegativeCodes.filter((c) => c !== code)
        : [...prev.fdiNegativeCodes, code],
    }));
  }

  function toggleLicense(label: string) {
    setForm((prev) => ({
      ...prev,
      licenseIndustries: prev.licenseIndustries.includes(label)
        ? prev.licenseIndustries.filter((l) => l !== label)
        : [...prev.licenseIndustries, label],
    }));
  }

  function updateAddress(idx: number, patch: Partial<AddressRow>) {
    setForm((prev) => {
      const addresses = [...prev.addresses];
      addresses[idx] = { ...addresses[idx], ...patch };
      return { ...prev, addresses };
    });
  }

  function updateShareholder(idx: number, key: string, value: string) {
    setShareholders((prev) => {
      const list = [...prev];
      list[idx] = { ...list[idx], [key]: value };
      return list;
    });
  }

  function validateEmailField(value: string): string | null {
    if (!value.trim()) return "Email is required.";
    if (!isValidEmail(value)) return "Enter a valid email (e.g. you@example.com).";
    return null;
  }

  function validatePhoneField(value: string): string | null {
    if (!value.trim()) return "Contact number is required.";
    if (!normalizePhone(value)) {
      return "Enter a valid phone number with country code (e.g. +977… or +1…).";
    }
    return null;
  }

  function validateStepAt(stepIndex: number): string | null {
    switch (stepIndex) {
      case 0: {
        if (!form.contactName.trim()) return "Your name is required.";
        if (form.contactName.trim().length < 2) return "Your name must be at least 2 characters.";
        const phoneMsg = validatePhoneField(form.phone);
        if (phoneMsg) return phoneMsg;
        const mailMsg = validateEmailField(form.email);
        if (mailMsg) return mailMsg;
        if (!form.name.trim()) return "Business name is required.";
        if (form.name.trim().length < 2) return "Business name must be at least 2 characters.";
        if (!isAllowed(form.objective, OBJECTIVE_VALUES)) {
          return "Select an objective (Manufacturing, Trading, or Service).";
        }
        if (!isAllowed(form.businessType, BUSINESS_TYPE_VALUES)) {
          return "Select a type of business.";
        }
        if (form.fdiRequested && (form.businessType === "PROPRIETORSHIP" || form.businessType === "PARTNERSHIP")) {
          return "FDI is not permitted for Proprietorship or Partnership. Choose a company type, or turn FDI off.";
        }
        if (form.fdiRequested && form.objective === "TRADING") {
          return "FDI is not permitted for Trading. Change the objective, or turn FDI off.";
        }
        const negativeHit = eligibilityIssues(form, shareholders).find(
          (i) => i.severity === "BLOCKER" && /^FDI-[A-I]$/.test(i.code) && i.code !== "FDI-B"
        );
        if (negativeHit) return negativeHit.message;
        return null;
      }
      case 1: {
        const ho = form.addresses.find((a) => a.kind === "HEAD_OFFICE");
        if (!ho?.district.trim() || !ho?.localBody.trim()) {
          return "Head office district and local body are required.";
        }
        return null;
      }
      case 2: {
        if (!isAllowed(form.objectiveCategory, OBJECTIVE_CATEGORY_VALUES)) {
          return "Select an industry objective category.";
        }
        if (form.objective === "TRADING" && form.objectiveCategory !== "TRADING") {
          return "Trading businesses must use the Trading industry objective category.";
        }
        if (form.fdiRequested && form.objectiveCategory === "TRADING") {
          return "FDI is not permitted for Trading. Change the industry objective category, or turn FDI off.";
        }
        return null;
      }
      case 3: {
        if (form.objective === "MANUFACTURING") {
          const capital =
            Number(form.equityInvestment || 0) + Number(form.loanInvestment || 0);
          if (capital <= 0) {
            return "Manufacturing ventures require equity and/or loan investment.";
          }
        }
        const issues = eligibilityIssues(form, shareholders).filter((i) => i.severity === "BLOCKER");
        const fdiMin = issues.find((i) => i.code === "FDI-MIN-CAPITAL");
        if (fdiMin) {
          return `FDI requires a minimum investment of Rs 2 crore (${formatNpr(MIN_FDI_CAPITAL_NPR)}), except for IT / ICT. Choose Information & Communication Technology as the industry category if this venture qualifies.`;
        }
        return null;
      }
      case 4: {
        const investmentIssue = investmentBlockers(form, shareholders).find(
          (i) => i.code === "INVESTMENT-MFG-MACHINERY" || i.code === "INVESTMENT-TOTAL-MISMATCH"
        );
        if (investmentIssue) return investmentIssue.message;
        return null;
      }
      case 5: {
        if (shareholders.length === 0) return "Add at least one shareholder category.";
        for (const s of shareholders) {
          const min = promoterMin(s.category);
          const n = Number(s.promoterCount || 0);
          if (!Number.isFinite(n) || n < min) {
            return min === 0
              ? "Promoter count cannot be negative."
              : "Each shareholder category needs at least 1 promoter.";
          }
        }
        const sh = eligibilityIssues(form, shareholders).find(
          (i) => i.severity === "BLOCKER" && i.code.startsWith("SHAREHOLDER-")
        );
        if (sh) return sh.message;
        return null;
      }
      case 6: {
        if (!isAllowed(form.sizeCategory, SIZE_VALUES)) return "Select industry size.";
        const sizeClass = checkIndustrySizeClassification(sizeFactsFromForm(form));
        if (sizeClass[0]) return sizeClass[0].message;
        const sizeBlock = eligibilityIssues(form, shareholders).find((i) => i.code === "FDI-B");
        if (sizeBlock) return sizeBlock.message;
        return null;
      }
      case 7:
        return null;
      default:
        return null;
    }
  }

  function validateStep() {
    return validateStepAt(step);
  }

  function firstInvalidStep(): { step: number; message: string } | null {
    for (let i = 0; i <= 7; i++) {
      const message = validateStepAt(i);
      if (message) return { step: i, message };
    }
    return null;
  }

  function nextStep() {
    const err = validateStep();
    if (err) {
      setError(err);
      setEmailChecked(true);
      setEmailError(validateEmailField(form.email));
      setPhoneError(validatePhoneField(form.phone));
      return;
    }
    setError(null);
    shouldScrollOnStep.current = true;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setError(null);
    shouldScrollOnStep.current = true;
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(n: number) {
    setError(null);
    shouldScrollOnStep.current = true;
    setStep(n);
  }

  function selectStep(n: number) {
    if (n === step) return;
    if (n > maxReachedStep) return;
    goToStep(n);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      nextStep();
      return;
    }
    const invalid = firstInvalidStep();
    if (invalid) {
      setError(invalid.message);
      setEmailChecked(true);
      setEmailError(validateEmailField(form.email));
      setPhoneError(validatePhoneField(form.phone));
      shouldScrollOnStep.current = true;
      setStep(invalid.step);
      toast.error(invalid.message);
      return;
    }
    const blockers = eligibilityIssues(form, shareholders).filter((i) => i.severity === "BLOCKER");
    if (blockers.length > 0) {
      setError(blockers[0].message);
      toast.error("Resolve eligibility issues before submitting.");
      return;
    }
    await submitIntake();
  }

  const totalCapital = Number(form.equityInvestment || 0) + Number(form.loanInvestment || 0);
  const assetTotal =
    Number(form.fixedAssets || 0) + Number(form.plantMachineryCost || 0) + Number(form.netCurrentAssets || 0);
  const plantMachineryMissing =
    form.objective === "MANUFACTURING" && Number(form.plantMachineryCost || 0) <= 0;
  const investmentMismatch = Math.abs(totalCapital - assetTotal) > 1 && (totalCapital > 0 || assetTotal > 0);
  const sizeGuide = isAllowed(form.sizeCategory, SIZE_VALUES)
    ? INDUSTRY_SIZE_GUIDE[form.sizeCategory as keyof typeof INDUSTRY_SIZE_GUIDE]
    : null;
  const proposedFixedCapital = fixedCapitalNpr({
    fixedAssets: Number(form.fixedAssets || 0),
    plantMachineryCost: Number(form.plantMachineryCost || 0),
  });
  const suggestedBracket = capitalSizeBracket(proposedFixedCapital);
  const sizeFacts = isAllowed(form.sizeCategory, SIZE_VALUES) ? sizeFactsFromForm(form) : null;
  const sizeClassIssues = sizeFacts ? checkIndustrySizeClassification(sizeFacts) : [];
  const sizeChecks = sizeFacts
    ? industrySizeChecklist(sizeFacts, { fdiRequested: form.fdiRequested })
    : [];
  const ieeExemptSize = form.sizeCategory === "MICRO" || form.sizeCategory === "COTTAGE";
  const selectedCriterion = criteria.find((c) => c.id === form.ieeEiaCriterionId);
  const ieeSectors = Array.from(new Set(criteria.map((c) => c.sector)));
  const ieeActivities = filterIeeCriteria(criteria, ieeSector, ieeQuery);
  const ieeNeedsFilter = !ieeSector && !ieeQuery.trim();
  const nameMissing = form.contactName.trim().length < 2;
  const phoneMissing = Boolean(validatePhoneField(form.phone));
  const emailMissing = Boolean(validateEmailField(form.email));
  const businessNameMissing = form.name.trim().length < 2;
  const objectiveMissing = !isAllowed(form.objective, OBJECTIVE_VALUES);
  const businessTypeMissing = !isAllowed(form.businessType, BUSINESS_TYPE_VALUES);
  const headOffice = form.addresses.find((a) => a.kind === "HEAD_OFFICE");
  const addressMissing = !headOffice?.district.trim() || !headOffice?.localBody.trim();
  const sizeMissing = !isAllowed(form.sizeCategory, SIZE_VALUES);
  const objectiveCategoryMissing = !isAllowed(form.objectiveCategory, OBJECTIVE_CATEGORY_VALUES);
  const listedAddresses = form.addresses.filter((a) => a.district || a.localBody);

  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <WizardSteps
        steps={STEPS}
        current={step}
        layout="sidebar"
        onSelect={selectStep}
        canSelect={(i) => i <= maxReachedStep}
      />

      <Card ref={cardRef} className="relative scroll-mt-28 gap-4 rounded-3xl py-4 sm:gap-5 sm:py-5">
        <CardContent className="px-4 pt-1 pb-2 sm:px-6 sm:pb-3 lg:px-7">
          <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
            {step === 0 && (
              <>
                <div>
                  <h2 className={STEP_HEADING}>A. Basic Details</h2>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                    <div className="space-y-1">
                      <Label>Your name *</Label>
                      <Input
                        required
                        maxLength={CONTACT_NAME_MAX}
                        value={form.contactName}
                        onChange={(e) =>
                          setForm({ ...form, contactName: e.target.value.slice(0, CONTACT_NAME_MAX) })
                        }
                        placeholder="Full name"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {form.contactName.length} / {CONTACT_NAME_MAX}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label>Contact number *</Label>
                      <Input
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={16}
                        value={form.phone}
                        onChange={(e) => {
                          const phone = sanitizePhoneInput(e.target.value);
                          setForm({ ...form, phone });
                          const digits = phone.replace(/\D/g, "");
                          setPhoneError(digits.length >= 7 ? validatePhoneField(phone) : null);
                        }}
                        onBlur={() => setPhoneError(validatePhoneField(form.phone))}
                        placeholder="+977 98XXXXXXXX"
                      />
                      {phoneError && <p className="mt-1 text-xs text-destructive">{phoneError}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        setForm({ ...form, email });
                        if (emailChecked) setEmailError(validateEmailField(email));
                      }}
                      onBlur={() => {
                        setEmailChecked(true);
                        setEmailError(validateEmailField(form.email));
                      }}
                      placeholder="you@example.com"
                      aria-invalid={Boolean(emailError)}
                    />
                    {emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Business name *</Label>
                    <Input
                      required
                      maxLength={BUSINESS_NAME_MAX}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, BUSINESS_NAME_MAX) })}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {form.name.length} / {BUSINESS_NAME_MAX}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label>Objective</Label>
                    <SelectField
                      value={form.objective}
                      onValueChange={(objective) => setForm({ ...form, objective })}
                      options={[
                        { value: "MANUFACTURING", label: "Manufacturing" },
                        { value: "TRADING", label: "Trading" },
                        { value: "SERVICE", label: "Service" },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type of Business</Label>
                    <SelectField
                      value={form.businessType}
                      onValueChange={(businessType) => setForm({ ...form, businessType })}
                      options={[
                        { value: "PRIVATE_LIMITED", label: "Private Limited" },
                        { value: "PUBLIC_LIMITED", label: "Public Limited" },
                        { value: "PROPRIETORSHIP", label: "Proprietorship" },
                        { value: "PARTNERSHIP", label: "Partnership" },
                      ]}
                    />
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground sm:mt-4">
                    <input
                      type="checkbox"
                      checked={form.fdiRequested}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fdiRequested: e.target.checked,
                          fdiNegativeCodes: e.target.checked ? form.fdiNegativeCodes : [],
                        })
                      }
                    />
                    Requesting Foreign Direct Investment (FDI)
                  </label>
                </div>
                {form.fdiRequested &&
                  (form.businessType === "PROPRIETORSHIP" || form.businessType === "PARTNERSHIP") && (
                    <p className="mt-2 text-xs text-destructive">
                      FDI is not permitted for Proprietorship or Partnership.
                    </p>
                  )}
                {form.fdiRequested && form.objective === "TRADING" && (
                  <p className="mt-2 text-xs text-destructive">FDI is not permitted for Trading objective.</p>
                )}
                {form.fdiRequested && (
                  <div className="mt-4 rounded-2xl border border-border p-4">
                    <p className="heading-soft mb-1 font-heading text-sm font-semibold tracking-[-0.015em] text-foreground">
                      FDI Negative List
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tick any activity that matches your project. FDI is not allowed in these sectors.
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {FDI_NEGATIVE_LIST.map((item) => (
                        <label key={item.code} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={form.fdiNegativeCodes.includes(item.code)}
                            onChange={() => toggleNegative(item.code)}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="font-medium text-foreground">
                              {item.code.replace(/^FDI-/, "")}.
                            </span>{" "}
                            {item.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <div>
              <h2 className={STEP_HEADING}>B. Address Details</h2>
              <p className={STEP_COPY}>
                Head office is required. Choose province, then district, then local body.
              </p>
              {form.addresses.map((addr, idx) => {
                const bodies = localBodyOptions(addr.district, addr.localBody);
                return (
                  <div
                    key={idx}
                    className="mb-3 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
                  >
                    <SelectField
                      value={addr.kind}
                      onValueChange={(kind) => updateAddress(idx, { kind: kind as AddressRow["kind"] })}
                      disabled={addr.kind === "HEAD_OFFICE" && idx === 0}
                      options={[
                        { value: "HEAD_OFFICE", label: "Head Office" },
                        { value: "BRANCH", label: "Branch" },
                        { value: "FACTORY", label: "Factory" },
                        { value: "GODOWN", label: "Godown" },
                        { value: "STORE", label: "Store" },
                      ]}
                    />
                    <SelectField
                      value={addr.province}
                      placeholder="Province"
                      onValueChange={(province) =>
                        updateAddress(idx, { province, district: "", localBody: "" })
                      }
                      options={NEPAL_PROVINCES.map((p) => ({ value: p, label: p }))}
                    />
                    <SelectField
                      value={addr.district}
                      placeholder="District"
                      disabled={!addr.province && !addr.district}
                      onValueChange={(district) =>
                        updateAddress(idx, {
                          district,
                          province: provinceOfDistrict(district) || addr.province,
                          localBody: "",
                        })
                      }
                      options={districtOptions(addr.province, addr.district)}
                    />
                    <SelectField
                      value={addr.localBody}
                      placeholder="Local body"
                      disabled={!addr.district}
                      onValueChange={(localBody) => updateAddress(idx, { localBody })}
                      options={bodies}
                    />
                  </div>
                );
              })}
              <SmoothButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    addresses: [
                      ...prev.addresses,
                      { kind: "BRANCH", province: "", district: "", localBody: "" },
                    ],
                  }))
                }
              >
                + Add address
              </SmoothButton>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className={STEP_HEADING}>D. Investment Details (Rs)</h2>
              <p className={STEP_COPY}>
                Equity + loan must later equal the proposed application total.
                {form.objective === "MANUFACTURING" ? " Required for manufacturing." : ""}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["equityInvestment", "Equity Investment"],
                    ["loanInvestment", "Loan Investment"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label>
                      {label}
                      {form.objective === "MANUFACTURING" ? " *" : ""}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      placeholder="0"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: nonNegativeAmount(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>
                  Total: <strong>{formatNpr(totalCapital)}</strong>
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className={STEP_HEADING}>E. Proposed Application (Rs)</h2>
              <p className={STEP_COPY}>
                {form.objective === "MANUFACTURING"
                  ? "How the capital will be applied. Plant & machinery is compulsory for manufacturing, and this total must equal investment."
                  : "How the capital will be applied. This total must equal equity + loan."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fixedAssets", "Fixed Assets (excl. Plant & Machinery)", false],
                    ["plantMachineryCost", "Plant & Machinery Cost", form.objective === "MANUFACTURING"],
                    ["netCurrentAssets", "Net Current Assets", false],
                  ] as const
                ).map(([key, label, required]) => (
                  <div key={key} className="space-y-1">
                    <Label>
                      {label}
                      {required ? " *" : ""}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      placeholder="0"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: nonNegativeAmount(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>
                  Total: <strong>{formatNpr(assetTotal)}</strong>
                  {totalCapital > 0 && (
                    <>
                      {" "}
                      · Investment: <strong>{formatNpr(totalCapital)}</strong>
                    </>
                  )}
                </p>
                {investmentMismatch && (
                  <p className="text-xs text-destructive">
                    Investment total and proposed application total must be equal.
                  </p>
                )}
                {plantMachineryMissing && (
                  <p className="text-xs text-destructive">
                    Manufacturing ventures must declare plant & machinery cost.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className={STEP_HEADING}>F. Shareholder Details</h2>
              <p className={STEP_COPY}>
                {form.businessType === "PRIVATE_LIMITED" && "Private Limited: maximum 100 shareholders."}
                {form.businessType === "PUBLIC_LIMITED" && "Public Limited: minimum 7 shareholders."}
                {form.businessType === "PROPRIETORSHIP" &&
                  "Proprietorship: one Nepali citizen owner only — no foreign or public capital."}
                {form.businessType === "PARTNERSHIP" &&
                  "Partnership: at least 2 partners; no foreign parties or public / secondary-market shares."}
              </p>
              {shareholders.map((s, idx) => {
                const min = promoterMin(s.category);
                return (
                  <div
                    key={idx}
                    className="mb-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                  >
                    <SelectField
                      value={s.category}
                      onValueChange={(category) => {
                        const nextMin = promoterMin(category);
                        setShareholders((prev) => {
                          const list = [...prev];
                          list[idx] = {
                            ...list[idx],
                            category,
                            promoterCount: promoterCountValue(
                              list[idx].promoterCount || String(nextMin),
                              nextMin
                            ),
                          };
                          return list;
                        });
                      }}
                      options={[...shareholderCategoryOptions(shareholders, idx)]}
                    />
                    <Input
                      type="number"
                      min={min}
                      step={1}
                      inputMode="numeric"
                      placeholder="No. of promoters"
                      value={s.promoterCount}
                      onChange={(e) =>
                        updateShareholder(idx, "promoterCount", promoterCountValue(e.target.value, min))
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      placeholder="Committed Capital (Rs)"
                      value={s.committedCapital}
                      onChange={(e) =>
                        updateShareholder(idx, "committedCapital", nonNegativeAmount(e.target.value))
                      }
                    />
                    <SmoothButton
                      type="button"
                      variant="outline"
                      color="destructive"
                      size="sm"
                      className="h-11 w-full lg:w-auto"
                      disabled={shareholders.length === 1}
                      onClick={() =>
                        setShareholders((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </SmoothButton>
                  </div>
                );
              })}
              <SmoothButton
                type="button"
                variant="outline"
                size="sm"
                disabled={nextShareholderCategory(shareholders) == null}
                onClick={() =>
                  setShareholders((prev) => {
                    const category = nextShareholderCategory(prev);
                    if (!category) return prev;
                    return [
                      ...prev,
                      {
                        category,
                        promoterCount: String(promoterMin(category)),
                        committedCapital: "",
                      },
                    ];
                  })
                }
              >
                + Add shareholder category
              </SmoothButton>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>
                  Total promoters:{" "}
                  <strong>
                    {shareholders.reduce((sum, s) => sum + Number(s.promoterCount || 0), 0)}
                  </strong>
                </p>
                <p>
                  Committed capital:{" "}
                  <strong>
                    {formatNpr(shareholders.reduce((sum, s) => sum + Number(s.committedCapital || 0), 0))}
                  </strong>
                </p>
                {eligibilityIssues(form, shareholders)
                  .filter((i) => i.severity === "BLOCKER" && i.code.startsWith("SHAREHOLDER-"))
                  .map((i) => (
                    <p key={i.code} className="text-xs text-destructive">
                      {i.message}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className={STEP_HEADING}>G. Category of Industry — Size</h2>
                <p className={STEP_COPY}>
                  Classify by fixed capital excluding land. Cottage is a special artisan category, not only a
                  capital band.
                </p>
              </div>

              <IndustrySizeOverview selected={form.sizeCategory} />

              <div className="space-y-3">
                <Label>Your classification *</Label>
                <SelectField
                  value={form.sizeCategory}
                  onValueChange={(sizeCategory) =>
                    setForm({
                      ...form,
                      sizeCategory,
                      cottageActivityConfirmed:
                        sizeCategory === "COTTAGE" ? form.cottageActivityConfirmed : false,
                    })
                  }
                  options={(Object.keys(INDUSTRY_SIZE_GUIDE) as Array<keyof typeof INDUSTRY_SIZE_GUIDE>).map(
                    (value) => ({
                      value,
                      label: `${INDUSTRY_SIZE_GUIDE[value].letter}. ${INDUSTRY_SIZE_GUIDE[value].label}`,
                    })
                  )}
                />
                <div className="grid gap-2 rounded-xl border border-border-subtle bg-muted/40 px-4 py-3 text-sm sm:grid-cols-2">
                  <p className="text-muted-foreground">
                    Proposed fixed capital
                    <span className="mt-0.5 block font-medium text-foreground">
                      {formatNpr(proposedFixedCapital)}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Capital band
                    <span className="mt-0.5 block font-medium text-foreground">
                      {suggestedBracket
                        ? `${prettyLabel(suggestedBracket)} — Cottage only if it is on the artisan list`
                        : "Enter proposed application amounts to test the band"}
                    </span>
                  </p>
                </div>
              </div>

              {sizeGuide && (
                <section className="space-y-4 rounded-2xl border border-border p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {sizeGuide.letter}. Selected rules
                      </p>
                      <h3 className="mt-1 font-heading text-base font-semibold text-foreground">
                        {sizeGuide.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{sizeGuide.capital}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusChip ok={sizeGuide.fdiAllowed} label={sizeGuide.fdiAllowed ? "FDI yes" : "FDI no"} />
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                        {sizeGuide.ieeTypical ? "IEE by activity" : "IEE typically no"}
                      </span>
                    </div>
                  </div>
                  <ol className="space-y-2 text-sm text-foreground">
                    {sizeGuide.rules.map((rule, index) => (
                      <li key={rule} className="flex gap-3">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ol>

                  {form.sizeCategory === "MICRO" && (
                    <div className="space-y-3 border-t border-border-subtle pt-4">
                      <p className="text-sm font-medium text-foreground">Confirm every Micro test</p>
                      <label className="flex items-start gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={form.ownerOperated}
                          onChange={(e) => setForm({ ...form, ownerOperated: e.target.checked })}
                        />
                        Owner-operated and managed by the entrepreneur
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label>Workers including entrepreneur *</Label>
                          <Input
                            type="number"
                            min={1}
                            max={9}
                            step={1}
                            inputMode="numeric"
                            placeholder="1–9"
                            value={form.workerCount}
                            onChange={(e) =>
                              setForm({ ...form, workerCount: promoterCountValue(e.target.value, 0) })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Annual turnover (Rs) *</Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            placeholder="Under 1,000,000"
                            value={form.annualTurnover}
                            onChange={(e) =>
                              setForm({ ...form, annualTurnover: nonNegativeAmount(e.target.value) })
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label>Power if machinery is used (kW)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            placeholder="0 if none — maximum 20"
                            value={form.powerKw}
                            onChange={(e) => setForm({ ...form, powerKw: nonNegativeAmount(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.sizeCategory === "COTTAGE" && (
                    <div className="space-y-3 border-t border-border-subtle pt-4">
                      <details className="rounded-xl border border-border-subtle bg-muted/30">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                          Cottage / artisan activity list
                        </summary>
                        <ol className="space-y-2 px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                          {COTTAGE_ACTIVITIES.map((item, index) => (
                            <li key={item} className="flex gap-2">
                              <span className="shrink-0 tabular-nums text-foreground/50">{index + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ol>
                      </details>
                      <div className="space-y-1">
                        <Label>Power if machinery is used (kW)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          placeholder="0 if none — maximum 50"
                          value={form.powerKw}
                          onChange={(e) => setForm({ ...form, powerKw: nonNegativeAmount(e.target.value) })}
                        />
                      </div>
                      <label className="flex items-start gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={form.cottageActivityConfirmed}
                          onChange={(e) =>
                            setForm({ ...form, cottageActivityConfirmed: e.target.checked })
                          }
                        />
                        This activity is on the cottage list and uses traditional or local skills
                      </label>
                    </div>
                  )}
                </section>
              )}

              {sizeChecks.length > 0 && (
                <ul className="space-y-2 rounded-2xl border border-border px-4 py-3">
                  {sizeChecks.map((check) => (
                    <li
                      key={check.id}
                      className={cn(
                        "grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 text-sm leading-6",
                        check.done ? "text-success-fg" : "text-destructive"
                      )}
                    >
                      <span aria-hidden className="pt-0.5 font-semibold">
                        {check.done ? "✓" : "•"}
                      </span>
                      <span>{check.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className={STEP_HEADING}>C. Category of Industry — Objective</h2>
              <p className={STEP_COPY}>
                Choose the sector path. Trading cannot take FDI. If the business objective is Trading, this
                category must be Trading.
              </p>
              <SelectField
                value={form.objectiveCategory}
                onValueChange={(objectiveCategory) => setForm({ ...form, objectiveCategory })}
                options={[
                  { value: "ENERGY", label: "Energy-based" },
                  { value: "MANUFACTURING", label: "Manufacturing" },
                  { value: "AGRICULTURE_FOREST", label: "Agriculture & Forest" },
                  { value: "MINERAL", label: "Mineral" },
                  { value: "INFRASTRUCTURE", label: "Infrastructure" },
                  { value: "TOURISM", label: "Tourism" },
                  { value: "ICT", label: "Information & Communication Technology" },
                  { value: "SERVICE", label: "Service" },
                  { value: "TRADING", label: "Trading" },
                ]}
              />
              {form.objective === "TRADING" && form.objectiveCategory !== "TRADING" && (
                <p className="mt-2 text-xs text-destructive">
                  Trading businesses must use the Trading industry objective category.
                </p>
              )}
              {form.fdiRequested && form.objectiveCategory === "TRADING" && (
                <p className="mt-2 text-xs text-destructive">
                  FDI is not permitted for Trading. Change the category, or turn FDI off.
                </p>
              )}
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className={STEP_HEADING}>H. License-Needed Industry</h2>
              <p className={STEP_COPY}>
                Tick any controlled sector, or leave blank if none apply. These require special government
                permission before normal registration.
              </p>
              <div className="space-y-3 rounded-2xl border border-border p-4">
                {LICENSE_NEEDED_INDUSTRIES.map((label) => (
                  <label key={label} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={form.licenseIndustries.includes(label)}
                      onChange={() => toggleLicense(label)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <div>
                <h2 className={STEP_HEADING}>I. IEE / EIA Screening</h2>
                <p className={STEP_COPY}>
                  {ieeExemptSize
                    ? "Micro and cottage industries are typically exempt. Search only if your activity is listed."
                    : "Choose a category, then search by activity or scale — for example hotel, crusher, or 10 MW."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <SelectField
                    wrapItems
                    aria-label="IEE / EIA category"
                    value={ieeSector}
                    onValueChange={(sector) => {
                      setIeeSector(sector);
                      setForm({ ...form, ieeEiaCriterionId: "" });
                    }}
                    options={[
                      { value: "", label: "All categories" },
                      ...ieeSectors.map((sector) => ({ value: sector, label: sector })),
                    ]}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Search activity or scale</Label>
                  <Input
                    type="search"
                    value={ieeQuery}
                    onChange={(e) => setIeeQuery(e.target.value)}
                    placeholder="hotel, hydropower, 50 beds…"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <label className="flex cursor-pointer items-start gap-3 border-b border-border-subtle px-4 py-3 text-sm">
                  <input
                    type="radio"
                    name="iee-eia-activity"
                    className="mt-1 size-4 shrink-0"
                    checked={!form.ieeEiaCriterionId}
                    onChange={() => setForm({ ...form, ieeEiaCriterionId: "" })}
                  />
                  <span className="leading-6 text-muted-foreground">
                    Not applicable / unsure — advisor will confirm
                  </span>
                </label>
                {ieeNeedsFilter ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    Choose a category or type a few words to see matching scopes and the study type.
                  </p>
                ) : ieeActivities.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    No match. Try another category or fewer words.
                  </p>
                ) : (
                  <div className="max-h-[min(26rem,55vh)] overflow-y-auto">
                    <p className="border-b border-border-subtle px-4 py-2 text-xs text-muted-foreground">
                      {ieeActivities.length} matching {ieeActivities.length === 1 ? "scope" : "scopes"}
                    </p>
                    {ieeActivities.map((c) => {
                      const selected = form.ieeEiaCriterionId === c.id;
                      return (
                        <label
                          key={c.id}
                          className={cn(
                            "grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0",
                            selected && "bg-brand-sky-muted/50"
                          )}
                        >
                          <input
                            type="radio"
                            name="iee-eia-activity"
                            className="mt-1 size-4"
                            checked={selected}
                            onChange={() => setForm({ ...form, ieeEiaCriterionId: c.id })}
                          />
                          <span className="min-w-0 space-y-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                  c.level === "EIA"
                                    ? "bg-destructive/10 text-destructive"
                                    : c.level === "IEE"
                                      ? "bg-brand-sky-muted text-brand-sky"
                                      : "bg-muted text-muted-foreground"
                                )}
                              >
                                {c.level === "BRIEF" ? "Brief" : c.level}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">{c.sector}</span>
                            </span>
                            <span className="block text-sm leading-6 text-foreground">{c.scope}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedCriterion && (
                <p className="text-sm text-brand-sky">
                  Indicative screening level: <strong>{selectedCriterion.level === "BRIEF" ? "Brief" : selectedCriterion.level}</strong>
                </p>
              )}
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4 text-sm">
              <div>
                <h2 className={STEP_HEADING}>Review your inquiry</h2>
                <p className="text-[1.05rem] leading-[1.75] text-muted-foreground">
                  Check every section before submitting. Use Edit to jump back and correct a step.
                </p>
              </div>

              <ReviewBlock
                title="Contact & business"
                onEdit={() => goToStep(0)}
                incomplete={
                  nameMissing ||
                  phoneMissing ||
                  emailMissing ||
                  businessNameMissing ||
                  objectiveMissing ||
                  businessTypeMissing
                }
              >
                <ReviewItem label="Your name" value={form.contactName} missing={nameMissing} />
                <ReviewItem label="Phone" value={form.phone} missing={phoneMissing} />
                <ReviewItem label="Email" value={form.email} missing={emailMissing} />
                <ReviewItem label="Business name" value={form.name} missing={businessNameMissing} />
                <ReviewItem
                  label="Type"
                  value={TYPE_LABEL[form.businessType] ?? prettyLabel(form.businessType)}
                  missing={businessTypeMissing}
                />
                <ReviewItem
                  label="Objective"
                  value={prettyLabel(form.objective)}
                  missing={objectiveMissing}
                />
                <ReviewItem label="FDI" value={form.fdiRequested ? "Yes" : "No"} />
              </ReviewBlock>

              <ReviewBlock title="Addresses" onEdit={() => goToStep(1)} incomplete={addressMissing}>
                {listedAddresses.length === 0 ? (
                  <ReviewItem label="Head office" value="" missing />
                ) : (
                  listedAddresses.map((a, i) => (
                    <ReviewItem
                      key={`${a.kind}-${i}`}
                      label={ADDRESS_KIND_LABEL[a.kind] ?? a.kind}
                      value={[a.province, a.district, a.localBody].filter(Boolean).join(" · ") || "—"}
                      missing={a.kind === "HEAD_OFFICE" && addressMissing}
                    />
                  ))
                )}
              </ReviewBlock>

              <ReviewBlock
                title="Industry objective category"
                onEdit={() => goToStep(2)}
                incomplete={objectiveCategoryMissing}
              >
                <ReviewItem
                  label="Objective category"
                  value={prettyLabel(form.objectiveCategory)}
                  missing={objectiveCategoryMissing}
                />
              </ReviewBlock>

              <ReviewBlock
                title="Investment (Rs)"
                onEdit={() => goToStep(3)}
                incomplete={investmentMismatch || (form.objective === "MANUFACTURING" && totalCapital <= 0)}
              >
                <ReviewItem label="Equity" value={formatNpr(Number(form.equityInvestment || 0))} />
                <ReviewItem label="Loan" value={formatNpr(Number(form.loanInvestment || 0))} />
                <ReviewItem label="Total capital" value={formatNpr(totalCapital)} />
              </ReviewBlock>

              <ReviewBlock
                title="Proposed application (Rs)"
                onEdit={() => goToStep(4)}
                incomplete={plantMachineryMissing || investmentMismatch}
              >
                <ReviewItem label="Fixed assets" value={formatNpr(Number(form.fixedAssets || 0))} />
                <ReviewItem
                  label="Plant & machinery"
                  value={formatNpr(Number(form.plantMachineryCost || 0))}
                  missing={plantMachineryMissing}
                />
                <ReviewItem label="Net current assets" value={formatNpr(Number(form.netCurrentAssets || 0))} />
                <ReviewItem label="Total" value={formatNpr(assetTotal)} missing={investmentMismatch} />
              </ReviewBlock>

              <ReviewBlock title="Shareholders" onEdit={() => goToStep(5)}>
                {shareholders.map((s, i) => (
                  <ReviewItem
                    key={`${s.category}-${i}`}
                    label={SHAREHOLDER_LABEL[s.category] ?? prettyLabel(s.category)}
                    value={`${s.promoterCount || "0"} promoter${Number(s.promoterCount) === 1 ? "" : "s"} · ${formatNpr(Number(s.committedCapital || 0))}`}
                  />
                ))}
              </ReviewBlock>

              <ReviewBlock
                title="Industry size"
                onEdit={() => goToStep(6)}
                incomplete={sizeMissing || sizeClassIssues.length > 0}
              >
                <ReviewItem
                  label="Industry size"
                  value={prettyLabel(form.sizeCategory)}
                  missing={sizeMissing || sizeClassIssues.length > 0}
                />
                <ReviewItem label="Fixed capital (excl. land)" value={formatNpr(proposedFixedCapital)} />
              </ReviewBlock>

              <ReviewBlock title="License-needed industry" onEdit={() => goToStep(7)}>
                <ReviewItem
                  label="License industries"
                  value={form.licenseIndustries.length ? form.licenseIndustries.join("; ") : "None selected"}
                />
              </ReviewBlock>

              <ReviewBlock title="Environment screening" onEdit={() => goToStep(8)}>
                <ReviewItem
                  label="IEE / EIA"
                  value={
                    selectedCriterion
                      ? `${selectedCriterion.level === "BRIEF" ? "Brief" : selectedCriterion.level} — ${selectedCriterion.sector}: ${selectedCriterion.scope}`
                      : "Advisor will confirm"
                  }
                />
              </ReviewBlock>

              <p className="text-[1.05rem] leading-[1.75] text-muted-foreground">
                Submit to save this inquiry. An ASAR Partners team member will also follow up using the phone
                and email you provided.
              </p>
            </div>
          )}

          <div className="absolute -left-[9999px] opacity-0 h-0 w-0 overflow-hidden" aria-hidden>
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <FormError>{error}</FormError>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {step > 0 && (
              <SmoothButton
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={prevStep}
                disabled={loading}
              >
                Back
              </SmoothButton>
            )}
            <SmoothButton type="submit" variant="candy" className="flex-1" disabled={loading}>
              {loading
                ? "Submitting..."
                : step < STEPS.length - 1
                  ? "Continue"
                  : "Get my registration guide"}
            </SmoothButton>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        ok ? "bg-success-bg text-success-fg" : "bg-destructive/10 text-destructive"
      )}
    >
      {label}
    </span>
  );
}

function IndustrySizeOverview({ selected }: { selected: string }) {
  return (
    <div className="rounded-2xl border border-border">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-border bg-muted/50 px-3 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:px-4">
        <span>Cat.</span>
        <span>Size</span>
        <span className="inline-flex w-[7.25rem] justify-between sm:w-[9.5rem]">
          <span>FDI</span>
          <span>IEE</span>
        </span>
      </div>
      {(Object.keys(INDUSTRY_SIZE_GUIDE) as Array<keyof typeof INDUSTRY_SIZE_GUIDE>).map((key) => {
        const row = INDUSTRY_SIZE_GUIDE[key];
        const active = selected === key;
        return (
          <div
            key={key}
            className={cn(
              "grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-3 border-b border-border-subtle px-3 py-3 last:border-b-0 sm:px-4",
              active && "bg-brand-sky-muted/40"
            )}
          >
            <span className="pt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{row.letter}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-5 text-foreground">{row.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{row.capital}</p>
            </div>
            <span className="inline-flex w-[7.25rem] shrink-0 items-start justify-between whitespace-nowrap pt-0.5 text-xs font-semibold sm:w-[9.5rem]">
              <span className={row.fdiAllowed ? "text-success-fg" : "text-destructive"}>
                {row.fdiAllowed ? "Yes" : "No"}
              </span>
              <span className="text-muted-foreground">{row.ieeTypical ? "By activity" : "No"}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
  incomplete,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
  incomplete?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border p-5",
        incomplete ? "border-destructive/40" : "border-border"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="heading-soft font-heading font-semibold tracking-[-0.015em] text-foreground">{title}</h3>
        <SmoothButton type="button" variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </SmoothButton>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewItem({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", missing ? "text-destructive" : "text-foreground")}>
        {missing ? value.trim() || "Not selected" : value || "—"}
      </dd>
    </div>
  );
}
