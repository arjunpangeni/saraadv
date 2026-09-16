"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { FileUp, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/ui/status-banner";
import SmoothButton from "@/components/smoothui/smooth-button";
import { ListingSubmitSuccessDialog } from "@/components/wizard/listing-submit-success-dialog";
import { FinancialStatementTables, type MatrixYearRow } from "@/components/wizard/financial-year-matrix";
import { FinancialExcelTools } from "@/components/wizard/financial-excel-tools";
import { NepalLocationFields, type NepalLocationValue } from "@/components/wizard/nepal-location-fields";
import { ListingWizardNav } from "@/components/wizard/listing-wizard-nav";
import type { WizardStepFill } from "@/components/console/wizard-steps";
import {
  listingWizardSchema,
  WIZARD_STEPS,
  INDUSTRY_OPTIONS,
  INDUSTRY_LABELS,
  LEGAL_STRUCTURE_OPTIONS,
  LEGAL_STRUCTURE_LABELS,
  MODALITY_OPTIONS,
  MODALITY_LABELS,
  EXIT_REASON_OPTIONS,
  EXIT_REASON_LABELS,
  REVALUATION_ASSET_TYPES,
  REVALUATION_ASSET_LABELS,
  COMPLIANCE_AUTHORITY_OPTIONS,
  COMPLIANCE_AUTHORITY_LABELS,
  type ListingWizardInput,
  type WizardStepKey,
  listingValidationErrors,
  listingStepForField,
  industryLabel,
  legalStructureLabel,
  modalityLabel,
} from "@/types/listing";
import { EMPTY_LINE_ITEMS, LINE_ITEM_KEYS, formatNpr, utilizationPct, type AnnualLineItems } from "@/lib/calc";
import { NEPAL_PROVINCES } from "@/lib/nepal-locations";
import {
  establishedYearOptions,
  forecastFiscalYears,
  historicalFiscalYears,
  displayYearOrder,
} from "@/lib/fiscal-years";
import { copyPreviousFiscalYear, previousFiscalYear } from "@/lib/listing-excel";

type DocumentKey = { key: string; type: string; label?: string };

type FormYear = MatrixYearRow & {
  revenueGrowthPct: number;
  netMarginPct: number;
  capex: number;
};

type FormState = {
  companyName: string;
  industry: string;
  legalStructure: string;
  establishedYear: string;
  operatingProvinces: string[];
  headOffice: NepalLocationValue;
  hasPlant: boolean;
  plantLocation: NepalLocationValue;
  strategicAssumptions: string;
  financials: FormYear[];
  projections: FormYear[];
  assetRevaluations: { assetType: string; bookValue: string; marketValue: string; notes: string }[];
  complianceRecords: {
    authority: string;
    status: string;
    identifier: string;
    lastClearanceYear: string;
    remarks: string;
  }[];
  ipAssets: { type: string; reference: string }[];
  askingPriceNpr: string;
  modality: string;
  exitReason: string;
  valuationJustification: string;
  managementCount: string;
  technicalCount: string;
  generalCount: string;
  ssfCompliant: boolean;
  outstandingDebt: string;
  assetEncumbrances: string;
  bankCollateralTies: string;
  pendingLitigations: string;
  runningOutput: string;
  installedPeak: string;
  capacityUnit: string;
  documentKeys: DocumentKey[];
};

function emptyYear(fiscalYear: number, label: string): FormYear {
  return {
    fiscalYear,
    fiscalYearLabel: label,
    ...EMPTY_LINE_ITEMS,
    revenueGrowthPct: 0,
    netMarginPct: 0,
    capex: 0,
  };
}

const HISTORICAL_YEARS = historicalFiscalYears();
const FORECAST_YEARS = forecastFiscalYears();

const initialState: FormState = {
  companyName: "",
  industry: "",
  legalStructure: "",
  establishedYear: "",
  operatingProvinces: [],
  headOffice: { province: "", district: "", localBody: "", ward: "" },
  hasPlant: false,
  plantLocation: { province: "", district: "", localBody: "", ward: "" },
  strategicAssumptions: "",
  financials: HISTORICAL_YEARS.map((y) => emptyYear(y.fiscalYear, y.label)),
  projections: FORECAST_YEARS.map((y) => emptyYear(y.fiscalYear, y.label)),
  assetRevaluations: REVALUATION_ASSET_TYPES.map((assetType) => ({
    assetType,
    bookValue: "",
    marketValue: "",
    notes: "",
  })),
  complianceRecords: COMPLIANCE_AUTHORITY_OPTIONS.map((authority) => ({
    authority,
    status: "PENDING",
    identifier: "",
    lastClearanceYear: "",
    remarks: "",
  })),
  ipAssets: [],
  askingPriceNpr: "",
  modality: "",
  exitReason: "",
  valuationJustification: "",
  managementCount: "",
  technicalCount: "",
  generalCount: "",
  ssfCompliant: false,
  outstandingDebt: "",
  assetEncumbrances: "",
  bankCollateralTies: "",
  pendingLitigations: "",
  runningOutput: "",
  installedPeak: "",
  capacityUnit: "",
  documentKeys: [],
};

const num = (v: string) => (v === "" ? 0 : Number(v));

function locationFilled(value: NepalLocationValue) {
  return Boolean(value.province && value.district && value.localBody);
}

function yearHasFigures(row: FormYear) {
  return LINE_ITEM_KEYS.some((key) => Number(row[key] ?? 0) !== 0);
}

function emptyYearLabels(rows: FormYear[]) {
  return rows.filter((row) => !yearHasFigures(row)).map((row) => row.fiscalYearLabel);
}

function canOpenWizardStep(index: number, form: FormState) {
  for (let i = 0; i < index; i += 1) {
    const step = WIZARD_STEPS[i];
    if (("optional" in step && step.optional) || step.key === "review") continue;
    if (!isStepComplete(step.key, form)) return false;
  }
  return true;
}

function isStepComplete(key: WizardStepKey, form: FormState): boolean {
  switch (key) {
    case "identification":
      return (
        form.companyName.trim().length >= 2 &&
        Boolean(form.industry) &&
        Boolean(form.legalStructure) &&
        Boolean(form.establishedYear) &&
        form.operatingProvinces.length > 0 &&
        locationFilled(form.headOffice) &&
        (!form.hasPlant || locationFilled(form.plantLocation))
      );
    case "financials":
      return form.financials.length === 3 && form.financials.every(yearHasFigures);
    case "projections":
      return form.projections.length === 3 && form.projections.every(yearHasFigures);
    case "revaluation":
      return form.assetRevaluations.some((a) => a.bookValue !== "" || a.marketValue !== "" || a.notes.trim() !== "");
    case "compliance":
      return (
        form.complianceRecords.some(
          (c) => c.status !== "PENDING" || c.identifier.trim() !== "" || c.lastClearanceYear !== "" || c.remarks.trim() !== ""
        ) || form.ipAssets.some((ip) => ip.reference.trim() !== "")
      );
    case "deal":
      return (
        form.askingPriceNpr !== "" &&
        Boolean(form.modality) &&
        Boolean(form.exitReason) &&
        form.valuationJustification.trim().length >= 10
      );
    case "enhancements":
      return Boolean(
        form.managementCount ||
          form.technicalCount ||
          form.generalCount ||
          form.ssfCompliant ||
          form.outstandingDebt ||
          form.assetEncumbrances.trim() ||
          form.bankCollateralTies.trim() ||
          form.pendingLitigations.trim() ||
          form.runningOutput ||
          form.installedPeak ||
          form.documentKeys.length
      );
    case "review":
      return (
        isStepComplete("identification", form) &&
        isStepComplete("financials", form) &&
        isStepComplete("projections", form) &&
        isStepComplete("deal", form)
      );
    default:
      return false;
  }
}

function yearPayload(row: FormYear) {
  return {
    fiscalYear: row.fiscalYear,
    fiscalYearLabel: row.fiscalYearLabel,
    ...EMPTY_LINE_ITEMS,
    ...Object.fromEntries(
      (Object.keys(EMPTY_LINE_ITEMS) as (keyof AnnualLineItems)[]).map((k) => [k, Number(row[k] ?? 0)])
    ),
    revenueGrowthPct: Number(row.revenueGrowthPct ?? 0),
    netMarginPct: Number(row.netMarginPct ?? 0),
    capex: Number(row.capex ?? 0),
  };
}

export function ListingWizard({
  edit,
}: {
  edit?: {
    id: string;
    hashId: string;
    reviewNotes?: string | null;
    draft: Record<string, unknown>;
    desk?: boolean;
  };
} = {}) {
  const wizardRef = useRef<HTMLDivElement>(null);
  const shouldScrollOnStep = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(() =>
    edit?.draft ? applyDraft(edit.draft) : initialState
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitted, setSubmitted] = useState<{ hashId: string } | null>(null);

  useEffect(() => {
    if (edit) return;
    fetch("/api/listings/draft")
      .then((r) => r.json())
      .then((data) => {
        if (data.draft && typeof data.draft === "object") {
          setForm(applyDraft(data.draft));
        }
      })
      .catch(() => {});
  }, [edit]);

  async function saveDraft() {
    setSavingDraft(true);
    const res = await fetch("/api/listings/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSavingDraft(false);
    if (!res.ok) {
      toast.error("Unable to save draft.");
      return;
    }
    setDraftSaved(true);
    toast.success("Draft saved.");
    setTimeout(() => setDraftSaved(false), 3000);
  }

  const step = WIZARD_STEPS[stepIndex];
  const stepStatuses = useMemo(
    () => WIZARD_STEPS.map((s): WizardStepFill => (isStepComplete(s.key, form) ? "complete" : "incomplete")),
    [form]
  );

  function changeStep(next: number | ((current: number) => number)) {
    shouldScrollOnStep.current = true;
    setStepIndex(next);
  }

  useEffect(() => {
    if (!shouldScrollOnStep.current) return;
    shouldScrollOnStep.current = false;
    const node = wizardRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [stepIndex]);

  function copyYear(listKey: "financials" | "projections", fiscalYear: number) {
    const source = previousFiscalYear(form[listKey], fiscalYear);
    setForm((prev) => ({
      ...prev,
      [listKey]: copyPreviousFiscalYear(prev[listKey], fiscalYear),
    }));
    if (source) {
      toast.success(`Copied ${source.fiscalYearLabel} into the selected year.`);
    }
  }

  function patch(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setFieldErrors((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      for (const key of Object.keys(partial)) {
        delete next[key];
        if (key === "headOffice") {
          delete next["headOffice.province"];
          delete next["headOffice.district"];
          delete next["headOffice.localBody"];
        }
        if (key === "plantLocation") {
          delete next["plantLocation.province"];
          delete next["plantLocation.district"];
          delete next["plantLocation.localBody"];
        }
      }
      return next;
    });
  }

  function patchYear(
    listKey: "financials" | "projections",
    fiscalYear: number,
    key: keyof AnnualLineItems | "revenueGrowthPct" | "netMarginPct" | "capex",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((row) =>
        row.fiscalYear === fiscalYear ? { ...row, [key]: value === "" ? 0 : Number(value) } : row
      ),
    }));
    setFieldErrors((prev) => {
      if (!prev[listKey]) return prev;
      const next = { ...prev };
      delete next[listKey];
      return next;
    });
  }

  function buildPayload(): ListingWizardInput {
    return {
      companyName: form.companyName,
      industry: (form.industry || undefined) as never,
      legalStructure: (form.legalStructure || undefined) as never,
      establishedYear: form.establishedYear ? Number(form.establishedYear) : (undefined as never),
      operatingProvinces: form.operatingProvinces,
      headOffice: form.headOffice,
      plantLocation: form.hasPlant ? form.plantLocation : undefined,
      strategicAssumptions: form.strategicAssumptions || undefined,
      financials: form.financials.map(yearPayload) as ListingWizardInput["financials"],
      projections: form.projections.map(yearPayload) as ListingWizardInput["projections"],
      assetRevaluations: form.assetRevaluations.map((a) => ({
        assetType: a.assetType as never,
        bookValue: num(a.bookValue),
        marketValue: num(a.marketValue),
        notes: a.notes || undefined,
      })),
      complianceRecords: form.complianceRecords.map((c) => ({
        authority: c.authority as never,
        status: c.status as never,
        identifier: c.identifier || undefined,
        lastClearanceYear: c.lastClearanceYear ? Number(c.lastClearanceYear) : undefined,
        remarks: c.remarks || undefined,
      })),
      ipAssets: form.ipAssets.filter((ip) => ip.reference.trim()).map((ip) => ({
        type: ip.type as never,
        reference: ip.reference,
      })),
      askingPriceNpr: num(form.askingPriceNpr),
      modality: (form.modality || undefined) as never,
      exitReason: (form.exitReason || undefined) as never,
      valuationJustification: form.valuationJustification,
      humanCapital: {
        managementCount: num(form.managementCount),
        technicalCount: num(form.technicalCount),
        generalCount: num(form.generalCount),
        ssfCompliant: form.ssfCompliant,
      },
      riskLog: {
        outstandingDebt: num(form.outstandingDebt),
        assetEncumbrances: form.assetEncumbrances || undefined,
        bankCollateralTies: form.bankCollateralTies || undefined,
        pendingLitigations: form.pendingLitigations || undefined,
      },
      capacityMetric:
        form.runningOutput && form.installedPeak
          ? {
              runningOutput: num(form.runningOutput),
              installedPeak: num(form.installedPeak),
              capacityUnit: form.capacityUnit || undefined,
            }
          : undefined,
      documentKeys: form.documentKeys.length
        ? form.documentKeys.map((d) => ({
            key: d.key,
            type: d.type as "REGULATORY_ATTACHMENT" | "FINANCIAL_STATEMENT" | "MOA_AOA" | "OTHER",
            label: d.label,
          }))
        : undefined,
    };
  }

  function validateStep(key: WizardStepKey): boolean {
    if (key === "financials") {
      const empty = emptyYearLabels(form.financials);
      if (empty.length) {
        setFieldErrors({
          financials: `${empty.join(", ")} ${empty.length === 1 ? "has" : "have"} no figures.`,
        });
        return false;
      }
    }
    if (key === "projections") {
      const empty = emptyYearLabels(form.projections);
      if (empty.length) {
        setFieldErrors({
          projections: `${empty.join(", ")} ${empty.length === 1 ? "has" : "have"} no figures.`,
        });
        return false;
      }
    }

    const payload = buildPayload();
    const picked =
      key === "identification"
        ? listingWizardSchema.pick({
            companyName: true,
            industry: true,
            legalStructure: true,
            establishedYear: true,
            operatingProvinces: true,
            headOffice: true,
            plantLocation: true,
          })
        : key === "financials"
          ? listingWizardSchema.pick({ financials: true })
          : key === "projections"
            ? listingWizardSchema.pick({ projections: true })
            : key === "deal"
              ? listingWizardSchema.pick({
                  askingPriceNpr: true,
                  modality: true,
                  exitReason: true,
                  valuationJustification: true,
                })
              : null;

    if (!picked) {
      setFieldErrors({});
      return true;
    }
    const parsed = picked.safeParse(payload);
    if (!parsed.success) {
      const { fields } = listingValidationErrors(parsed.error);
      setFieldErrors(fields);
      return false;
    }
    setFieldErrors({});
    return true;
  }

  async function handleSubmit() {
    const histEmpty = emptyYearLabels(form.financials);
    if (histEmpty.length) {
      setFieldErrors({
        financials: `${histEmpty.join(", ")} ${histEmpty.length === 1 ? "has" : "have"} no figures.`,
      });
      changeStep(WIZARD_STEPS.findIndex((s) => s.key === "financials"));
      return;
    }
    const forecastEmpty = emptyYearLabels(form.projections);
    if (forecastEmpty.length) {
      setFieldErrors({
        projections: `${forecastEmpty.join(", ")} ${forecastEmpty.length === 1 ? "has" : "have"} no figures.`,
      });
      changeStep(WIZARD_STEPS.findIndex((s) => s.key === "projections"));
      return;
    }

    const payload = buildPayload();
    const parsed = listingWizardSchema.safeParse(payload);
    if (!parsed.success) {
      const { fields } = listingValidationErrors(parsed.error);
      setFieldErrors(fields);
      const firstKey = Object.keys(fields)[0];
      if (firstKey) {
        const target = listingStepForField(firstKey);
        const idx = WIZARD_STEPS.findIndex((s) => s.key === target);
        if (idx >= 0) changeStep(idx);
      }
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    const res = await fetch(edit ? `/api/listings/${edit.id}` : "/api/listings", {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message =
        typeof data.error === "string"
          ? data.error
          : Array.isArray(data.details)
            ? data.details[0]
            : "Unable to submit. Please review your entries.";
      setFieldErrors({ _form: message });
      return;
    }
    const data = await res.json();
    setSubmitted(data);
  }

  function openStep(index: number) {
    if (!canOpenWizardStep(index, form)) return;
    changeStep(index);
    setFieldErrors({});
  }

  return (
    <div ref={wizardRef} className="scroll-mt-16 sm:scroll-mt-[4.25rem]">
      <ListingSubmitSuccessDialog
        open={Boolean(submitted)}
        hashId={submitted?.hashId ?? ""}
        desk={edit?.desk}
        updated={Boolean(edit) && !edit?.desk}
      />
      <ListingWizardNav
        steps={WIZARD_STEPS}
        current={stepIndex}
        statuses={stepStatuses}
        canOpen={(i) => canOpenWizardStep(i, form)}
        onSelect={openStep}
      />

      {edit?.reviewNotes ? (
        <p className="mb-4 rounded-xl border border-border bg-warning-bg px-4 py-3 text-sm leading-relaxed text-warning-fg">
          <span className="font-semibold">Desk suggestion: </span>
          {edit.reviewNotes}
        </p>
      ) : null}

      <Card className="card-elevated border-0">
        <CardContent className="p-5 sm:p-8 lg:p-10">
          {step.key === "identification" && (
            <IdentificationStep form={form} patch={patch} fieldErrors={fieldErrors} />
          )}
          {step.key === "financials" && (
            <div className="space-y-6">
              <div className="mb-2 space-y-1.5">
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Past 3 years (Rs)
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enter figures for three consecutive completed fiscal years. Totals, gross profit, EBITDA, PBT and net
                  profit calculate automatically. On a phone, start with the latest year — or fill Excel and upload it.
                </p>
              </div>
              <FinancialExcelTools
                kind="historical"
                years={form.financials}
                onImported={({ years }) => patch({ financials: years })}
              />
              <FinancialStatementTables
                years={form.financials}
                editable
                onChange={(fy, key, value) => patchYear("financials", fy, key, value)}
                onCopyPreviousYear={(fy) => copyYear("financials", fy)}
              />
              <FormError>{fieldErrors.financials}</FormError>
            </div>
          )}
          {step.key === "projections" && (
            <div className="space-y-4">
              <ProjectionsStep
                form={form}
                patch={patch}
                onChange={(fy, key, value) => patchYear("projections", fy, key, value)}
                onExtra={(fy, key, value) => patchYear("projections", fy, key, value)}
                onCopyPreviousYear={(fy) => copyYear("projections", fy)}
              />
              <FormError>{fieldErrors.projections}</FormError>
            </div>
          )}
          {step.key === "revaluation" && <RevaluationStep form={form} setForm={setForm} />}
          {step.key === "compliance" && <ComplianceStep form={form} setForm={setForm} />}
          {step.key === "deal" && <DealStep form={form} patch={patch} fieldErrors={fieldErrors} />}
          {step.key === "enhancements" && <EnhancementsStep form={form} patch={patch} />}
          {step.key === "review" && (
            <ReviewStep form={form} onEdit={(key) => openStep(WIZARD_STEPS.findIndex((s) => s.key === key))} />
          )}

          <FormError className="mt-6">{fieldErrors._form}</FormError>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <SmoothButton
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={stepIndex === 0}
                onClick={() => {
                  setFieldErrors({});
                  changeStep((i) => i - 1);
                }}
              >
                Back
              </SmoothButton>
              {!edit ? (
                <SmoothButton type="button" variant="ghost" className="w-full sm:w-auto" onClick={saveDraft} disabled={savingDraft}>
                  {savingDraft ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : draftSaved ? (
                    "Draft saved"
                  ) : (
                    "Save draft"
                  )}
                </SmoothButton>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {"optional" in step && step.optional ? (
                <SmoothButton
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setFieldErrors({});
                    changeStep((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
                  }}
                >
                  Skip
                </SmoothButton>
              ) : null}
              {step.key === "review" ? (
                <SmoothButton
                  type="button"
                  variant="candy"
                  className="w-full sm:w-auto"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : edit?.desk ? "Save changes" : edit ? "Resubmit for review" : "Submit for review"}
                </SmoothButton>
              ) : (
                <SmoothButton
                  type="button"
                  variant="candy"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (!validateStep(step.key)) return;
                    changeStep((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
                  }}
                >
                  Continue
                </SmoothButton>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function applyDraft(draft: Record<string, unknown>): FormState {
  return {
    ...initialState,
    ...(draft as Partial<FormState>),
    financials: mergeYears(initialState.financials, draft.financials),
    projections: mergeYears(initialState.projections, draft.projections),
    assetRevaluations: Array.isArray(draft.assetRevaluations) && draft.assetRevaluations.length
      ? (draft.assetRevaluations as FormState["assetRevaluations"])
      : initialState.assetRevaluations,
    complianceRecords: Array.isArray(draft.complianceRecords) && draft.complianceRecords.length
      ? (draft.complianceRecords as FormState["complianceRecords"])
      : initialState.complianceRecords,
    operatingProvinces: Array.isArray(draft.operatingProvinces)
      ? (draft.operatingProvinces as string[])
      : initialState.operatingProvinces,
  };
}

function mergeYears(defaults: FormYear[], incoming: unknown): FormYear[] {
  if (!Array.isArray(incoming) || incoming.length === 0) return defaults;
  return defaults.map((base, i) => {
    const row = incoming.find((r: { fiscalYear?: number }) => r?.fiscalYear === base.fiscalYear) ?? incoming[i];
    if (!row || typeof row !== "object") return base;
    return { ...base, ...row, fiscalYear: base.fiscalYear, fiscalYearLabel: base.fiscalYearLabel };
  });
}

function FieldHint({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-destructive">{children}</p>;
}

function IdentificationStep({
  form,
  patch,
  fieldErrors,
}: {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
  fieldErrors: Record<string, string>;
}) {
  function toggleProvince(province: string) {
    const selected = form.operatingProvinces.includes(province)
      ? form.operatingProvinces.filter((p) => p !== province)
      : [...form.operatingProvinces, province];
    patch({ operatingProvinces: selected });
  }

  return (
    <div>
      <div className="mb-8 space-y-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Company details</h2>
      </div>
      <div className="space-y-5">
      <div>
        <Label htmlFor="companyName">Legal company name (confidential)</Label>
        <Input
          id="companyName"
          placeholder="e.g. Himalayan Hydropower Pvt. Ltd."
          value={form.companyName}
          aria-invalid={Boolean(fieldErrors.companyName)}
          onChange={(e) => patch({ companyName: e.target.value })}
        />
        <FieldHint>{fieldErrors.companyName}</FieldHint>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Industry / Sector</Label>
          <SelectField
            value={form.industry}
            onValueChange={(industry) => patch({ industry })}
            placeholder="Select sector"
            className={fieldErrors.industry ? "border-destructive" : undefined}
            options={INDUSTRY_OPTIONS.map((o) => ({ value: o, label: INDUSTRY_LABELS[o] }))}
          />
          <FieldHint>{fieldErrors.industry}</FieldHint>
        </div>
        <div>
          <Label>Legal Structure</Label>
          <SelectField
            value={form.legalStructure}
            onValueChange={(legalStructure) => patch({ legalStructure })}
            placeholder="Select structure"
            className={fieldErrors.legalStructure ? "border-destructive" : undefined}
            options={LEGAL_STRUCTURE_OPTIONS.map((o) => ({ value: o, label: LEGAL_STRUCTURE_LABELS[o] }))}
          />
          <FieldHint>{fieldErrors.legalStructure}</FieldHint>
        </div>
        <div>
          <Label>Established Year (AD)</Label>
          <SelectField
            value={form.establishedYear}
            onValueChange={(establishedYear) => patch({ establishedYear })}
            placeholder="Select year"
            className={fieldErrors.establishedYear ? "border-destructive" : undefined}
            options={establishedYearOptions().map((y) => ({ value: String(y), label: String(y) }))}
          />
          <FieldHint>{fieldErrors.establishedYear}</FieldHint>
        </div>
      </div>

      <div>
        <Label>Operating provinces (multiple)</Label>
        <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {NEPAL_PROVINCES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-foreground rounded-md border border-border-subtle px-3 py-2">
              <input
                type="checkbox"
                checked={form.operatingProvinces.includes(p)}
                onChange={() => toggleProvince(p)}
              />
              {p}
            </label>
          ))}
        </div>
        <FieldHint>{fieldErrors.operatingProvinces}</FieldHint>
      </div>

      <div>
        <h3 className="font-medium text-foreground">Address details</h3>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Head office is required. Choose province, then district, then local body.
        </p>
        <NepalLocationFields
          idPrefix="ho"
          title="Head Office"
          value={form.headOffice}
          errors={{
            province: fieldErrors["headOffice.province"],
            district: fieldErrors["headOffice.district"],
            localBody: fieldErrors["headOffice.localBody"],
          }}
          onChange={(headOffice) => {
            const provinces =
              form.operatingProvinces.includes(headOffice.province) || !headOffice.province
                ? form.operatingProvinces
                : [...form.operatingProvinces, headOffice.province];
            patch({ headOffice, operatingProvinces: provinces });
          }}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={form.hasPlant} onChange={(e) => patch({ hasPlant: e.target.checked })} />
        This business has a separate Factory / Plant location
      </label>
      {form.hasPlant && (
        <NepalLocationFields
          idPrefix="plant"
          title="Factory / Plant"
          value={form.plantLocation}
          errors={{
            province: fieldErrors["plantLocation.province"],
            district: fieldErrors["plantLocation.district"],
            localBody: fieldErrors["plantLocation.localBody"],
          }}
          onChange={(plantLocation) => patch({ plantLocation })}
        />
      )}
      </div>
    </div>
  );
}

function ProjectionsStep({
  form,
  patch,
  onChange,
  onExtra,
  onCopyPreviousYear,
}: {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
  onChange: (fiscalYear: number, key: keyof AnnualLineItems, value: string) => void;
  onExtra: (fiscalYear: number, key: "revenueGrowthPct" | "netMarginPct" | "capex", value: string) => void;
  onCopyPreviousYear: (fiscalYear: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Next 3 years</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Full-capacity case. Enter projected statements for the next three fiscal years, plus growth, margin, CAPEX,
          and strategic assumptions. You can also fill the Excel template and upload it.
        </p>
      </div>
      <FinancialExcelTools
        kind="forecast"
        years={form.projections}
        notes={form.strategicAssumptions}
        onImported={({ years, strategicAssumptions }) =>
          patch({
            projections: years,
            ...(strategicAssumptions ? { strategicAssumptions } : {}),
          })
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-border-subtle">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">Particulars</th>
              {displayYearOrder(form.projections).map((y) => (
                <th key={y.fiscalYear} className="min-w-[10.5rem] px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide">
                  {y.fiscalYearLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["Projected revenue growth %", "revenueGrowthPct"],
                ["Projected net profit margin %", "netMarginPct"],
                ["Future CAPEX (Rs)", "capex"],
              ] as const
            ).map(([label, key]) => (
              <tr key={key} className="border-t border-border-subtle">
                <td className="px-4 py-2.5">{label}</td>
                {displayYearOrder(form.projections).map((y) => (
                  <td key={y.fiscalYear} className="px-3 py-2">
                    <Input
                      type="number"
                      className="h-11 text-right"
                      value={y[key] || ""}
                      onChange={(e) => onExtra(y.fiscalYear, key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 border-t border-border-subtle pt-8">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Strategic assumptions
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Optional. One note for all forecast years. Also in the Excel row named strategicAssumptions — upload fills this box.
          </p>
        </div>
        <Textarea
          id="strategic-assumptions"
          rows={5}
          placeholder="Operational expansion, asset modernisation, or other full-capacity assumptions"
          value={form.strategicAssumptions}
          onChange={(e) => patch({ strategicAssumptions: e.target.value })}
        />
      </div>
      <FinancialStatementTables
        years={form.projections}
        editable
        onChange={onChange}
        onCopyPreviousYear={onCopyPreviousYear}
      />
    </div>
  );
}

function RevaluationStep({ form, setForm }: { form: FormState; setForm: Dispatch<SetStateAction<FormState>> }) {
  function update(idx: number, key: string, value: string) {
    setForm((prev) => {
      const list = [...prev.assetRevaluations];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, assetRevaluations: list };
    });
  }

  return (
    <div>
      <div className="mb-8 space-y-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Asset values</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Optional. Map book records to current realisable value, or skip.
        </p>
      </div>
      <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        {form.assetRevaluations.map((a, idx) => {
          const net = num(a.marketValue) - num(a.bookValue);
          const label =
            REVALUATION_ASSET_LABELS[a.assetType as keyof typeof REVALUATION_ASSET_LABELS] ?? a.assetType;
          return (
            <div key={a.assetType} className="space-y-3 rounded-lg border border-border-subtle p-3">
              <p className="font-medium text-foreground">{label}</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Book value</Label>
                  <Input type="number" className="h-10 text-right" value={a.bookValue} onChange={(e) => update(idx, "bookValue", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Realisable value</Label>
                  <Input type="number" className="h-10 text-right" value={a.marketValue} onChange={(e) => update(idx, "marketValue", e.target.value)} />
                </div>
              </div>
              <p className="text-sm font-semibold">Net: {formatNpr(net)}</p>
              <Input
                placeholder="Notes"
                className="h-10"
                value={a.notes}
                onChange={(e) => update(idx, "notes", e.target.value)}
              />
            </div>
          );
        })}
      </div>
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-border-subtle md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background/90 text-muted-foreground">
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide">Particulars</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wide">Book Value</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wide">Realisable Value</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wide">Net Adjustments</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody>
            {form.assetRevaluations.map((a, idx) => {
              const net = num(a.marketValue) - num(a.bookValue);
              return (
                <tr key={a.assetType} className="border-t border-border-subtle">
                  <td className="px-3 py-2 font-medium">
                    {REVALUATION_ASSET_LABELS[a.assetType as keyof typeof REVALUATION_ASSET_LABELS] ?? a.assetType}
                  </td>
                  <td className="px-2 py-1">
                    <Input type="number" className="h-8 text-right" value={a.bookValue} onChange={(e) => update(idx, "bookValue", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input type="number" className="h-8 text-right" value={a.marketValue} onChange={(e) => update(idx, "marketValue", e.target.value)} />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold bg-brand-sky-muted/40">{formatNpr(net)}</td>
                  <td className="px-2 py-1">
                    <Input
                      placeholder="Notes"
                      className="h-8"
                      value={a.notes}
                      onChange={(e) => update(idx, "notes", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceStep({ form, setForm }: { form: FormState; setForm: Dispatch<SetStateAction<FormState>> }) {
  function updateCompliance(idx: number, key: string, value: string) {
    setForm((prev) => {
      const list = [...prev.complianceRecords];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, complianceRecords: list };
    });
  }
  function addIp() {
    setForm((prev) => ({ ...prev, ipAssets: [...prev.ipAssets, { type: "TRADEMARK", reference: "" }] }));
  }
  function updateIp(idx: number, key: string, value: string) {
    setForm((prev) => {
      const list = [...prev.ipAssets];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, ipAssets: list };
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display mb-2 text-lg font-semibold tracking-tight text-foreground">Licenses and IP</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">Optional. Add what you have, or skip.</p>
        <div className="space-y-3 md:hidden">
          {form.complianceRecords.map((c, idx) => {
            const label =
              COMPLIANCE_AUTHORITY_LABELS[c.authority as keyof typeof COMPLIANCE_AUTHORITY_LABELS] ??
              c.authority.replace(/_/g, " ");
            return (
              <div key={c.authority} className="space-y-3 rounded-lg border border-border-subtle p-3">
                <p className="font-medium text-foreground">{label}</p>
                {c.authority === "IRD" && (
                  <Input
                    className="h-10"
                    placeholder="PAN / VAT"
                    value={c.identifier}
                    onChange={(e) => updateCompliance(idx, "identifier", e.target.value)}
                  />
                )}
                <SelectField
                  value={c.status}
                  onValueChange={(status) => updateCompliance(idx, "status", status)}
                  options={[
                    { value: "COMPLIANT", label: "Compliant" },
                    { value: "PENDING", label: "Pending" },
                    { value: "NON_COMPLIANT", label: "Non-Compliant" },
                  ]}
                />
                <Input
                  placeholder="Year (AD)"
                  type="number"
                  className="h-10"
                  value={c.lastClearanceYear}
                  onChange={(e) => updateCompliance(idx, "lastClearanceYear", e.target.value)}
                />
                <Input
                  placeholder="Remarks"
                  className="h-10"
                  value={c.remarks}
                  onChange={(e) => updateCompliance(idx, "remarks", e.target.value)}
                />
              </div>
            );
          })}
        </div>
        <div className="hidden rounded-lg border border-border-subtle md:block">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/90 text-muted-foreground">
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wide">Particulars</th>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wide">Status</th>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wide">Complied upto</th>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wide">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {form.complianceRecords.map((c, idx) => (
                <tr key={c.authority} className="border-t border-border-subtle align-top">
                  <td className="px-3 py-2 font-medium min-w-[12rem]">
                    {COMPLIANCE_AUTHORITY_LABELS[c.authority as keyof typeof COMPLIANCE_AUTHORITY_LABELS] ??
                      c.authority.replace(/_/g, " ")}
                    {c.authority === "IRD" && (
                      <Input
                        className="mt-2 h-8"
                        placeholder="PAN / VAT"
                        value={c.identifier}
                        onChange={(e) => updateCompliance(idx, "identifier", e.target.value)}
                      />
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <SelectField
                      value={c.status}
                      onValueChange={(status) => updateCompliance(idx, "status", status)}
                      options={[
                        { value: "COMPLIANT", label: "Compliant" },
                        { value: "PENDING", label: "Pending" },
                        { value: "NON_COMPLIANT", label: "Non-Compliant" },
                      ]}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      placeholder="Year (AD)"
                      type="number"
                      className="h-8"
                      value={c.lastClearanceYear}
                      onChange={(e) => updateCompliance(idx, "lastClearanceYear", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      placeholder="Remarks"
                      className="h-8"
                      value={c.remarks}
                      onChange={(e) => updateCompliance(idx, "remarks", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-3">Intellectual Property registry</h2>
        {form.ipAssets.map((ip, idx) => (
          <div key={idx} className="border rounded-lg p-4 grid sm:grid-cols-2 gap-3 mb-3">
            <SelectField
              value={ip.type}
              onValueChange={(type) => updateIp(idx, "type", type)}
              options={[
                { value: "TRADEMARK", label: "Trademark" },
                { value: "PATENT", label: "Patent" },
                { value: "COPYRIGHT", label: "Copyright" },
              ]}
            />
            <Input placeholder="Reference / registration number" value={ip.reference} onChange={(e) => updateIp(idx, "reference", e.target.value)} />
          </div>
        ))}
        <SmoothButton type="button" variant="outline" size="sm" onClick={addIp}>
          Add IP asset
        </SmoothButton>
      </div>

      <DocumentUploadSection form={form} setForm={setForm} />
    </div>
  );
}

function DocumentUploadSection({
  form,
  setForm,
}: {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/listings/documents/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setUploadError(typeof data.error === "string" ? data.error : "Upload failed. Try a PDF, image, or Excel file under 10 MB.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      documentKeys: [
        ...prev.documentKeys,
        { key: data.key as string, type: "REGULATORY_ATTACHMENT", label: file.name },
      ],
    }));
  }

  return (
    <div>
      <h2 className="font-semibold text-foreground mb-2">Regulatory attachments</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Optional. PDF, image, or Excel · max 10 MB.
      </p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border-subtle px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-brand-sky hover:text-brand-sky">
        <FileUp className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload document"}
        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls" onChange={onFile} disabled={uploading} />
      </label>
      <FormError className="mt-3">{uploadError}</FormError>
      {form.documentKeys.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {form.documentKeys.map((d, i) => (
            <li key={d.key} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
              <span className="min-w-0 truncate">{d.label || d.key.split("/").pop()}</span>
              <button
                type="button"
                className="rounded-full p-1 text-foreground/55 hover:bg-surface-muted hover:text-foreground"
                aria-label={`Remove ${d.label || "document"}`}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    documentKeys: prev.documentKeys.filter((_, idx) => idx !== i),
                  }))
                }
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DealStep({
  form,
  patch,
  fieldErrors,
}: {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div>
      <div className="mb-8 space-y-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Sale terms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Proposed price, how the sale is structured, and why you are exiting.
        </p>
      </div>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <NumField label="Proposed Sale Value (Rs)" value={form.askingPriceNpr} onChange={(v) => patch({ askingPriceNpr: v })} />
            <FieldHint>{fieldErrors.askingPriceNpr}</FieldHint>
          </div>
          <div>
            <Label>Transaction Modality</Label>
            <SelectField
              value={form.modality}
              onValueChange={(modality) => patch({ modality })}
              placeholder="Select"
              className={fieldErrors.modality ? "border-destructive" : undefined}
              options={MODALITY_OPTIONS.map((o) => ({ value: o, label: MODALITY_LABELS[o] }))}
            />
            <FieldHint>{fieldErrors.modality}</FieldHint>
          </div>
          <div>
            <Label>Reason for Exit</Label>
            <SelectField
              value={form.exitReason}
              onValueChange={(exitReason) => patch({ exitReason })}
              placeholder="Select"
              className={fieldErrors.exitReason ? "border-destructive" : undefined}
              options={EXIT_REASON_OPTIONS.map((o) => ({ value: o, label: EXIT_REASON_LABELS[o] }))}
            />
            <FieldHint>{fieldErrors.exitReason}</FieldHint>
          </div>
        </div>
        <div>
          <Label>Justification of Sale Value</Label>
          <Textarea
            rows={4}
            placeholder="e.g. valuation multiples used (P/E, EV/EBITDA, DCF) and underlying market advantages"
            value={form.valuationJustification}
            aria-invalid={Boolean(fieldErrors.valuationJustification)}
            onChange={(e) => patch({ valuationJustification: e.target.value })}
          />
          <FieldHint>{fieldErrors.valuationJustification}</FieldHint>
        </div>
      </div>
    </div>
  );
}

function EnhancementsStep({ form, patch }: { form: FormState; patch: (p: Partial<FormState>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display mb-2 text-lg font-semibold tracking-tight text-foreground">Team</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">Optional. Headcount and risk notes help the desk, or skip.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumField label="Management Staff" value={form.managementCount} onChange={(v) => patch({ managementCount: v })} />
          <NumField label="Technical Staff" value={form.technicalCount} onChange={(v) => patch({ technicalCount: v })} />
          <NumField label="General Staff" value={form.generalCount} onChange={(v) => patch({ generalCount: v })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
          <input type="checkbox" checked={form.ssfCompliant} onChange={(e) => patch({ ssfCompliant: e.target.checked })} />
          Compliant with Social Security Fund (SSF) guidelines
        </label>
      </div>

      <div>
        <h2 className="font-display mb-6 text-lg font-semibold tracking-tight text-foreground">Debt and risk</h2>
        <NumField label="Outstanding Corporate Debt (Rs)" value={form.outstandingDebt} onChange={(v) => patch({ outstandingDebt: v })} />
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <Textarea placeholder="Asset encumbrances" value={form.assetEncumbrances} onChange={(e) => patch({ assetEncumbrances: e.target.value })} />
          <Textarea placeholder="Bank collateral ties" value={form.bankCollateralTies} onChange={(e) => patch({ bankCollateralTies: e.target.value })} />
        </div>
        <Textarea className="mt-3" placeholder="Pending civil/labor court litigations" value={form.pendingLitigations} onChange={(e) => patch({ pendingLitigations: e.target.value })} />
      </div>

      <div>
        <h2 className="font-display mb-6 text-lg font-semibold tracking-tight text-foreground">Plant capacity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumField label="Current running output" value={form.runningOutput} onChange={(v) => patch({ runningOutput: v })} />
          <NumField label="Capacity as per license (installed peak)" value={form.installedPeak} onChange={(v) => patch({ installedPeak: v })} />
          <div>
            <Label>Unit</Label>
            <Input placeholder="e.g. MW, MT/day, rooms" value={form.capacityUnit} onChange={(e) => patch({ capacityUnit: e.target.value })} />
          </div>
        </div>
        {form.runningOutput && form.installedPeak && (
          <p className="mt-2 text-sm font-medium text-brand-sky">
            Utilization: {utilizationPct(num(form.runningOutput), num(form.installedPeak))}%
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  onEdit,
}: {
  form: FormState;
  onEdit: (key: WizardStepKey) => void;
}) {
  const sections = useMemo(
    () =>
      [
        {
          key: "identification" as const,
          eyebrow: "Desk only",
          title: "Company",
          rows: [
            ["Legal name", form.companyName],
            ["Industry", industryLabel(form.industry)],
            ["Legal structure", legalStructureLabel(form.legalStructure)],
            ["Established", form.establishedYear],
            ["Provinces", form.operatingProvinces.join(", ")],
            [
              "Head office",
              [form.headOffice.province, form.headOffice.district, form.headOffice.localBody].filter(Boolean).join(", "),
            ],
          ],
        },
        {
          key: "deal" as const,
          eyebrow: "Buyers see after approval",
          title: "Sale terms",
          rows: [
            ["Asking price", form.askingPriceNpr ? formatNpr(num(form.askingPriceNpr)) : ""],
            ["Modality", modalityLabel(form.modality)],
          ],
        },
        {
          key: "financials" as const,
          eyebrow: "Desk only",
          title: "Books",
          rows: [
            ["Past 3 years", form.financials.every(yearHasFigures) ? "Figures entered" : "Missing figures"],
            ["Next 3 years", form.projections.every(yearHasFigures) ? "Figures entered" : "Missing figures"],
            ["Documents", `${form.documentKeys.length} uploaded`],
          ],
        },
      ] as const,
    [form]
  );

  return (
    <div>
      <div className="mb-6 space-y-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Review and submit</h2>
      </div>
      <div className="space-y-3">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => onEdit(section.key)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-brand-sky"
          >
            <p className="text-xs font-semibold tracking-wide text-brand-sky uppercase">{section.eyebrow}</p>
            <p className="mt-1 font-display text-base font-extrabold">{section.title}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {section.rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs font-medium text-brand-sky">Edit</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
