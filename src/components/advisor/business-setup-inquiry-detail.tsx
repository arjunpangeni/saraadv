"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Phone, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select-field";
import { toast } from "sonner";
import { formatNpr } from "@/lib/calc";
import { FDI_NEGATIVE_LIST } from "@/lib/rules/startABusiness";
import { SETUP_STATUS_OPTIONS, setupStatusBadge } from "@/components/advisor/business-setup-desk";

const SECTOR_LABEL: Record<string, string> = {
  food_beverage: "Food & Beverage",
  pharma: "Pharmaceuticals",
  telecom: "Telecom",
  telecom_it: "IT / ICT",
  tourism: "Tourism / Hospitality",
  aviation: "Aviation",
  transport: "Transport",
  bfi: "Banking / Financial Institution",
  insurance: "Insurance",
  capital_market: "Capital Market / Securities",
  import_export: "Import / Export Trading",
  health: "Healthcare",
  labor_intensive: "Labor-Intensive Manufacturing",
};

const ADDRESS_KIND_LABEL: Record<string, string> = {
  HEAD_OFFICE: "Head Office",
  BRANCH: "Branch",
  FACTORY: "Factory",
  GODOWN: "Godown",
  STORE: "Store",
};

const SHAREHOLDER_LABEL: Record<string, string> = {
  NEPALI_CITIZEN: "Nepali Citizen",
  FOREIGN_CITIZEN: "Foreign Citizen",
  NEPALI_ENTITY: "Nepali Entity",
  FOREIGN_ENTITY: "Foreign Entity",
  PUBLIC: "General Public / Secondary Market",
};

const TYPE_LABEL: Record<string, string> = {
  PRIVATE_LIMITED: "Private Limited",
  PUBLIC_LIMITED: "Public Limited",
  PROPRIETORSHIP: "Proprietorship",
  PARTNERSHIP: "Partnership",
};

export type BusinessSetupInquiryDetailData = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  objective: string;
  businessType: string;
  fdiRequested: boolean;
  status: string;
  createdAt: string;
  sectorTags: string[];
  licenseIndustries: string[];
  fdiNegativeCodes: string[];
  addresses: { kind: string; district: string; localBody: string }[];
  investment: {
    equityInvestment: number;
    loanInvestment: number;
    fixedAssets: number;
    plantMachineryCost: number;
    netCurrentAssets: number;
  } | null;
  shareholders: { category: string; promoterCount: number; committedCapital: number }[];
  sizeCategory: string | null;
  objectiveCategory: string | null;
  licenseRequired: boolean;
  ieeEiaLevel: string | null;
};

function pretty(value: string) {
  return value.replace(/_/g, " ");
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">{children}</CardContent>
    </Card>
  );
}

export function BusinessSetupInquiryDetail({
  inquiry,
  backHref = "/advisor/business-setups",
  submittedAt,
}: {
  inquiry: BusinessSetupInquiryDetailData;
  backHref?: string;
  submittedAt?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(inquiry.status);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const capital =
    (inquiry.investment?.equityInvestment ?? 0) + (inquiry.investment?.loanInvestment ?? 0);
  const badge = setupStatusBadge(status);

  async function patchStatus(next: string) {
    setSaving(true);
    const res = await fetch(`/api/business-setup/${inquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to update this request.");
      return;
    }
    toast.success("Status updated.");
    router.refresh();
  }

  async function removeInquiry() {
    setSaving(true);
    const res = await fetch(`/api/business-setup/${inquiry.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to delete this request.");
      setConfirmDelete(false);
      return;
    }
    toast.success("Request deleted.");
    router.push(backHref);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {inquiry.fdiRequested && <Badge variant="warning">FDI</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {inquiry.contactName}
            {submittedAt ? ` · Submitted ${submittedAt}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            value={status}
            disabled={saving}
            className="w-full sm:w-[11rem]"
            aria-label="Inquiry status"
            onValueChange={(next) => {
              setStatus(next);
              void patchStatus(next);
            }}
            options={SETUP_STATUS_OPTIONS}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={`tel:${inquiry.phone}`}>
            <Phone aria-hidden />
            {inquiry.phone}
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`mailto:${inquiry.email}`}>
            <Mail aria-hidden />
            {inquiry.email}
          </a>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Contact & business">
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="Contact" value={inquiry.contactName} />
            <Field label="Phone" value={inquiry.phone} />
            <Field label="Email" value={inquiry.email} />
            <Field label="Business" value={inquiry.name} />
            <Field label="Objective" value={pretty(inquiry.objective)} />
            <Field label="Type" value={TYPE_LABEL[inquiry.businessType] ?? pretty(inquiry.businessType)} />
            <Field label="FDI" value={inquiry.fdiRequested ? "Yes" : "No"} />
            <Field
              label="Sectors"
              value={
                inquiry.sectorTags.length
                  ? inquiry.sectorTags.map((t) => SECTOR_LABEL[t] ?? pretty(t)).join(", ")
                  : "—"
              }
            />
          </dl>
        </DetailCard>

        <DetailCard title="Classification">
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="Industry size" value={inquiry.sizeCategory ? pretty(inquiry.sizeCategory) : "—"} />
            <Field
              label="Objective category"
              value={inquiry.objectiveCategory ? pretty(inquiry.objectiveCategory) : "—"}
            />
            <Field
              label="License-needed industry"
              value={
                inquiry.licenseIndustries.length
                  ? inquiry.licenseIndustries.join("; ")
                  : inquiry.licenseRequired
                    ? "Yes (industries not listed)"
                    : "None selected"
              }
            />
            <Field label="IEE / EIA screening" value={inquiry.ieeEiaLevel ?? "None / advisor to confirm"} />
          </dl>
        </DetailCard>
      </div>

      {inquiry.fdiRequested && inquiry.fdiNegativeCodes.length > 0 && (
        <DetailCard title="FDI negative list selected">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {inquiry.fdiNegativeCodes.map((code) => {
              const item = FDI_NEGATIVE_LIST.find((i) => i.code === code);
              return (
                <li key={code}>
                  <span className="font-medium text-foreground">{code}</span>
                  {item ? ` — ${item.description}` : ""}
                </li>
              );
            })}
          </ul>
        </DetailCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Addresses">
          {inquiry.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <dl className="grid gap-2">
              {inquiry.addresses.map((a, i) => (
                <Field
                  key={`${a.kind}-${i}`}
                  label={ADDRESS_KIND_LABEL[a.kind] ?? pretty(a.kind)}
                  value={[a.district, a.localBody].filter(Boolean).join(" · ")}
                />
              ))}
            </dl>
          )}
        </DetailCard>

        <DetailCard title="Investment (Rs)">
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="Equity" value={formatNpr(inquiry.investment?.equityInvestment ?? 0)} />
            <Field label="Loan" value={formatNpr(inquiry.investment?.loanInvestment ?? 0)} />
            <Field label="Total capital" value={formatNpr(capital)} />
            <Field label="Fixed assets" value={formatNpr(inquiry.investment?.fixedAssets ?? 0)} />
            <Field label="Plant & machinery" value={formatNpr(inquiry.investment?.plantMachineryCost ?? 0)} />
            <Field label="Net current assets" value={formatNpr(inquiry.investment?.netCurrentAssets ?? 0)} />
          </dl>
        </DetailCard>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this inquiry?"
        description={
          <>
            Delete the inquiry for <strong className="text-foreground">{inquiry.name}</strong>? This cannot
            be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={() => void removeInquiry()}
        onClose={() => !saving && setConfirmDelete(false)}
      />

      <DetailCard title="Shareholders">
        {inquiry.shareholders.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {inquiry.shareholders.map((s, i) => (
              <li key={`${s.category}-${i}`} className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground">
                <p className="font-medium">{SHAREHOLDER_LABEL[s.category] ?? pretty(s.category)}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {s.promoterCount} promoter{s.promoterCount === 1 ? "" : "s"} · {formatNpr(s.committedCapital)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>
    </div>
  );
}
