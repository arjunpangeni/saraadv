"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select-field";
import { formatNpr } from "@/lib/calc";
import { SETUP_STATUS_OPTIONS, setupStatusBadge } from "@/components/advisor/business-setup-desk";

const TYPE_LABEL: Record<string, string> = {
  PRIVATE_LIMITED: "Private Limited",
  PUBLIC_LIMITED: "Public Limited",
  PROPRIETORSHIP: "Proprietorship",
  PARTNERSHIP: "Partnership",
};

export type BusinessSetupInquiryCard = {
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
  submittedAt?: string;
  submittedTitle?: string;
  fromView?: string;
  addresses: { kind: string; district: string; localBody: string }[];
  investment: { equityInvestment: number; loanInvestment: number } | null;
};

function pretty(value: string) {
  return value.replace(/_/g, " ");
}

export function BusinessSetupInquiryRow({
  inquiry,
  manage = false,
}: {
  inquiry: BusinessSetupInquiryCard;
  manage?: boolean;
}) {
  const capital =
    (inquiry.investment?.equityInvestment ?? 0) + (inquiry.investment?.loanInvestment ?? 0);
  const headOffice = inquiry.addresses.find((a) => a.kind === "HEAD_OFFICE");
  const location = [headOffice?.district, headOffice?.localBody].filter(Boolean).join(", ");
  const typeLabel = TYPE_LABEL[inquiry.businessType] ?? pretty(inquiry.businessType);
  const badge = setupStatusBadge(inquiry.status);
  const submitted = inquiry.submittedAt ?? new Date(inquiry.createdAt).toLocaleDateString();
  const openHref = inquiry.fromView
    ? `/advisor/business-setups/${inquiry.id}?from=${inquiry.fromView}`
    : `/advisor/business-setups/${inquiry.id}`;

  if (!manage) {
    return (
      <Card className="gap-0 overflow-hidden py-0 transition-colors hover:border-brand-sky/40">
        <CardHeader className="px-4 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-sky-muted text-brand-sky">
              <Building2 className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <CardTitle className="truncate text-sm sm:text-base">{inquiry.name}</CardTitle>
                <Badge variant={badge.variant}>{badge.label}</Badge>
                {inquiry.fdiRequested ? <Badge variant="warning">FDI</Badge> : null}
              </div>
              <CardDescription className="truncate">
                {inquiry.contactName}
                {submitted ? ` · ${submitted}` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 px-4 pb-3 text-xs text-muted-foreground">
          <p className="truncate">
            {pretty(inquiry.objective)} · {typeLabel}
          </p>
          <p className="truncate">{location || "No head office"}</p>
          <p className="truncate">{capital > 0 ? formatNpr(capital) : "Capital not set"}</p>
        </CardContent>
        <CardFooter className="border-t px-4 py-3">
          <Button asChild variant="sky" size="sm" className="w-full">
            <Link href={openHref}>Open</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <article className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold tracking-tight text-foreground">{inquiry.name}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {inquiry.fdiRequested ? <Badge variant="warning">FDI</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-foreground/60">{inquiry.contactName}</p>
          <p className="mt-2 text-sm text-foreground/70">
            {pretty(inquiry.objective)} · {typeLabel}
            {location ? ` · ${location}` : ""}
            <span className="text-foreground/40" title={inquiry.submittedTitle}>
              {" "}
              · {submitted}
            </span>
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {inquiry.email ? (
              <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky">
                <Mail className="size-3.5" aria-hidden />
                {inquiry.email}
              </a>
            ) : null}
            {inquiry.phone ? (
              <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky">
                <Phone className="size-3.5" aria-hidden />
                {inquiry.phone}
              </a>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <SetupDeskStatusSelect id={inquiry.id} status={inquiry.status} />
          <Button asChild variant="outline" size="sm">
            <Link href={openHref}>Open</Link>
          </Button>
          <SetupDeleteButton id={inquiry.id} name={inquiry.name} />
        </div>
      </div>
    </article>
  );
}

function SetupDeskStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function onValueChange(next: string) {
    setLoading(true);
    setValue(next);
    const res = await fetch(`/api/business-setup/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setValue(status);
      toast.error("Unable to update this request.");
      return;
    }
    toast.success("Status updated.");
    router.refresh();
  }

  return (
    <SelectField
      value={value}
      onValueChange={onValueChange}
      disabled={loading}
      className="h-9 w-auto min-w-[9.5rem] text-xs"
      aria-label="Update setup status"
      options={SETUP_STATUS_OPTIONS}
    />
  );
}

function SetupDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeSetup() {
    setDeleting(true);
    const res = await fetch(`/api/business-setup/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Unable to delete this request.");
      setOpen(false);
      return;
    }
    toast.success("Request deleted.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => setOpen(true)}>
        <Trash2 className="size-3.5" aria-hidden />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this request?"
        description={
          <>
            Remove <strong className="text-foreground">{name}</strong> from setup requests. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void removeSetup()}
        onClose={() => !deleting && setOpen(false)}
      />
    </>
  );
}
