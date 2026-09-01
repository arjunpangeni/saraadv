"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import SmoothButton from "@/components/smoothui/smooth-button";
import Dialog from "@/components/smoothui/dialog";
import { ListingLeadForm } from "@/components/marketplace/listing-lead-form";
import type { ListingLeadPrefill } from "@/lib/listing-lead-session";

export function ListingLeadReceived({ hashId, name }: { hashId: string; name?: string }) {
  return (
    <aside className="rounded-2xl border border-success/30 bg-success-bg/40 px-5 py-5">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-success-fg uppercase">
        <CheckCircle2 className="size-3.5" aria-hidden />
        Request received
      </p>
      <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
        {name ? `Thanks, ${name.split(" ")[0]}.` : "We have your request."}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        Your work email is confirmed for {hashId}. SARA Advisors will contact you to arrange the NDA.
        The full data room stays offline — it is not unlocked on this page.
      </p>
    </aside>
  );
}

export function ListingLeadModal({
  listingId,
  hashId,
  compact,
  prefill,
}: {
  listingId: string;
  hashId: string;
  compact?: boolean;
  prefill?: ListingLeadPrefill;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const remembered = Boolean(prefill?.email);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSubmitted(false);
    }
  }

  const dialog = (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={submitted ? "Check your inbox" : "Request the full profile"}
      showCloseButton
      className="max-h-[min(92dvh,44rem)] overflow-y-auto overscroll-contain sm:max-w-lg"
    >
      <ListingLeadForm
        listingId={listingId}
        hashId={hashId}
        prefill={prefill}
        inlineSuccess
        onSubmitted={() => setSubmitted(true)}
      />
    </Dialog>
  );

  if (compact) {
    return (
      <aside className="rounded-2xl border border-brand-sky/30 bg-brand-sky-muted px-5 py-5">
        <p className="text-[11px] font-semibold tracking-wide text-brand-sky uppercase">Next step</p>
        <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
          Request the full profile
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          {remembered
            ? "Your work email is remembered on this browser for 24 hours. Confirm interest in this listing — no new account."
            : "Confirm your work email. After vetting and an NDA, SARA Advisors share the data room offline. No password or buyer account."}
        </p>
        <SmoothButton variant="candy" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Request Full Profile
        </SmoothButton>
        {dialog}
      </aside>
    );
  }

  return (
    <>
      <SmoothButton variant="candy" size="lg" onClick={() => setOpen(true)}>
        Request Full Profile
      </SmoothButton>
      {dialog}
    </>
  );
}
