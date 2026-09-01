"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DealLeadStatusSelect } from "@/components/advisor/deal-lead-status-select";
import { LeadAdminNotes } from "@/components/project-bank/lead-admin-notes";
import { DEAL_DESK_STATUS_LABELS } from "@/types/project-bank";
import type { DealDeskStatus } from "@prisma/client";

function statusBadge(status: string) {
  if (status === "REJECTED") return { label: DEAL_DESK_STATUS_LABELS.REJECTED, variant: "danger" as const };
  if (status === "DOSSIER_RELEASED") {
    return { label: DEAL_DESK_STATUS_LABELS.DOSSIER_RELEASED, variant: "success" as const };
  }
  if (status === "UNDER_VETTING") {
    return { label: DEAL_DESK_STATUS_LABELS.UNDER_VETTING, variant: "warning" as const };
  }
  if (status === "NDA_SENT" || status === "NDA_SIGNED") {
    return {
      label: DEAL_DESK_STATUS_LABELS[status as DealDeskStatus],
      variant: "sky" as const,
    };
  }
  return { label: DEAL_DESK_STATUS_LABELS.NEW, variant: "secondary" as const };
}

export function DealLeadRow({
  kind,
  id,
  name,
  firm,
  email,
  phone,
  investorType,
  timeframe,
  targetLabel,
  targetHref,
  targetCompany,
  targetMeta,
  verified,
  status,
  notes,
  createdAt,
  createdTitle,
}: {
  kind: "buyer" | "investor";
  id: string;
  name: string;
  firm: string | null;
  email: string;
  phone: string;
  investorType?: string | null;
  timeframe?: string | null;
  targetLabel: string;
  targetHref: string;
  targetCompany?: string | null;
  targetMeta?: string | null;
  verified: boolean;
  status: string;
  notes: string | null;
  createdAt: string;
  createdTitle?: string;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const isBuyer = kind === "buyer";
  const badge = statusBadge(status);
  const qualify = [firm, investorType, timeframe].filter(Boolean).join(" · ");

  return (
    <article className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-extrabold tracking-tight text-foreground">{name}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <Badge variant={verified ? "success" : "warning"}>{verified ? "Email confirmed" : "Awaiting email"}</Badge>
          </div>
          {qualify ? <p className="mt-0.5 text-sm text-foreground/60">{qualify}</p> : null}

          <p className="mt-2 text-sm text-foreground/70">
            <Link
              href={targetHref}
              className={isBuyer ? "font-mono font-medium text-brand-sky hover:underline" : "font-medium text-brand-sky hover:underline"}
            >
              {targetLabel}
            </Link>
            {targetCompany ? <span className="text-foreground"> · {targetCompany}</span> : null}
            {targetMeta ? <span className="text-foreground/55"> · {targetMeta}</span> : null}
            <span className="text-foreground/40" title={createdTitle}>
              {" "}
              · {createdAt}
            </span>
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky">
              <Mail className="size-3.5" aria-hidden />
              {email}
            </a>
            {phone ? (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-brand-sky">
                <Phone className="size-3.5" aria-hidden />
                {phone}
              </a>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <DealLeadStatusSelect id={id} status={status} verified={verified} kind={kind} />
          <Button
            type="button"
            variant={showNotes || notes ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowNotes((open) => !open)}
          >
            <StickyNote className="size-3.5" aria-hidden />
            {notes ? "Note" : "Add note"}
          </Button>
          <DealLeadDeleteButton id={id} name={name} kind={kind} />
        </div>
      </div>

      {showNotes ? (
        <LeadAdminNotes
          className="mt-4"
          id={id}
          notes={notes}
          saveUrl={isBuyer ? `/api/listing-leads/${id}` : `/api/project-leads/${id}`}
          placeholder={isBuyer ? "Desk notes (not visible to the buyer)…" : "Desk notes (not visible to the investor)…"}
        />
      ) : null}
    </article>
  );
}

function DealLeadDeleteButton({
  id,
  name,
  kind,
}: {
  id: string;
  name: string;
  kind: "buyer" | "investor";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const endpoint = kind === "buyer" ? `/api/listing-leads/${id}` : `/api/project-leads/${id}`;

  async function removeLead() {
    setDeleting(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Unable to delete this lead.");
      setOpen(false);
      return;
    }
    toast.success("Lead deleted.");
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
        title="Delete this lead?"
        description={
          <>
            Remove <strong className="text-foreground">{name}</strong> from the {kind} pipeline. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void removeLead()}
        onClose={() => !deleting && setOpen(false)}
      />
    </>
  );
}
