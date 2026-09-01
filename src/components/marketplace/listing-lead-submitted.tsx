"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { ListingMagicLinkResend } from "@/components/marketplace/listing-magic-link-resend";
import { maskEmail } from "@/lib/listing-magic-link";

export function ListingLeadSubmitted({
  name,
  email,
  hashId,
  listingId,
  compact = false,
}: {
  name: string;
  email: string;
  hashId: string;
  listingId: string;
  compact?: boolean;
}) {
  const masked = maskEmail(email);
  const firstName = name.trim().split(/\s+/)[0];

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="rounded-2xl border border-success/30 bg-success-bg/40 px-4 py-4 sm:px-5 sm:py-5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-success-fg uppercase">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Request received
        </p>
        <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
          {firstName ? `Thanks, ${firstName}.` : "Thank you."}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          We sent a confirmation link to <span className="font-semibold text-foreground">{masked}</span> for{" "}
          <span className="font-semibold text-foreground">{hashId}</span>. Open that email and click the link — no
          password. It expires in 24 hours.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-sky/30 bg-brand-sky-muted px-4 py-4 sm:px-5 sm:py-5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand-sky uppercase">
          <Mail className="size-3.5" aria-hidden />
          Check your inbox
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">
          After you confirm your email, SARA Advisors vet the request, arrange an NDA, and share the data room
          offline.
        </p>
        <p className="mt-2 text-xs text-foreground/55">Check spam or promotions if you do not see the email.</p>
        <ListingMagicLinkResend email={email} listingId={listingId} />
      </div>
    </div>
  );
}
