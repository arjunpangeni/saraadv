"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectField } from "@/components/ui/select-field";
import { Card, CardContent } from "@/components/ui/card";
import { LeadAdminNotes } from "@/components/project-bank/lead-admin-notes";
import { SERVICE_INQUIRY_LABELS, isServiceInquiryType } from "@/lib/service-inquiries";

export function ServiceInquiryRow({
  inquiry,
}: {
  inquiry: {
    id: string;
    type: string;
    contactName: string;
    phone: string;
    email: string;
    subject: string | null;
    message: string;
    status: string;
    notes: string | null;
    createdAt: string;
    createdTitle?: string;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(inquiry.status);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = messageRef.current;
    if (!el || open) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [inquiry.message, open]);

  async function patchStatus(next: string) {
    setSaving(true);
    const res = await fetch(`/api/service-inquiries/${inquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to update status.");
      return;
    }
    setStatus(next);
    toast.success("Status updated.");
    router.refresh();
  }

  async function removeInquiry() {
    setDeleting(true);
    const res = await fetch(`/api/service-inquiries/${inquiry.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Unable to delete this inquiry.");
      setConfirmDelete(false);
      return;
    }
    toast.success("Inquiry deleted.");
    setConfirmDelete(false);
    router.refresh();
  }

  const typeLabel = isServiceInquiryType(inquiry.type)
    ? SERVICE_INQUIRY_LABELS[inquiry.type]
    : inquiry.type;

  return (
    <Card className="rounded-2xl border-border shadow-[var(--shadow-card)]">
      <CardContent className="space-y-3 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{inquiry.contactName}</h3>
              <Badge variant="secondary">{typeLabel}</Badge>
              <Badge variant={status === "NEW" ? "warning" : status === "CONTACTED" ? "sky" : "default"}>
                {status === "NEW" ? "New" : status === "CONTACTED" ? "Contacted" : "Closed"}
              </Badge>
            </div>
            {inquiry.subject ? (
              <p className="mt-1.5 text-sm font-medium text-foreground">{inquiry.subject}</p>
            ) : null}
            <p
              ref={messageRef}
              className={
                open
                  ? "mt-1 whitespace-pre-wrap text-sm text-muted-foreground"
                  : "mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground"
              }
            >
              {inquiry.message}
            </p>
            {open || clamped ? (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-1 text-xs font-medium text-brand-sky hover:underline"
              >
                {open ? "Show less" : "Show more"}
              </button>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground" title={inquiry.createdTitle}>
              {inquiry.createdAt}
            </p>
          </div>
          <SelectField
            value={status}
            disabled={saving}
            className="w-auto"
            onValueChange={(next) => {
              void patchStatus(next);
            }}
            options={[
              { value: "NEW", label: "New" },
              { value: "CONTACTED", label: "Contacted" },
              { value: "CLOSED", label: "Closed" },
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="sky" size="sm">
            <a href={`tel:${inquiry.phone}`}>
              <Phone className="size-3.5" aria-hidden />
              Call
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${inquiry.email}`}>
              <Mail className="size-3.5" aria-hidden />
              Email
            </a>
          </Button>
          <Button
            type="button"
            variant={showNotes || inquiry.notes ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowNotes((v) => !v)}
          >
            <StickyNote className="size-3.5" aria-hidden />
            {inquiry.notes ? "Note" : "Add note"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleting}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </Button>
        </div>

        {showNotes ? (
          <LeadAdminNotes
            id={inquiry.id}
            notes={inquiry.notes}
            saveUrl={`/api/service-inquiries/${inquiry.id}`}
            field="notes"
            placeholder="Desk notes (not visible to the sender)…"
          />
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this inquiry?"
        description={
          <>
            Remove the message from <strong className="text-foreground">{inquiry.contactName}</strong>. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void removeInquiry()}
        onClose={() => !deleting && setConfirmDelete(false)}
      />
    </Card>
  );
}
