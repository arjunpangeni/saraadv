"use client";

import Link from "next/link";
import { CheckCircle2, Eye, Lock } from "lucide-react";
import Dialog from "@/components/smoothui/dialog";
import SmoothButton from "@/components/smoothui/smooth-button";

export function ListingSubmitSuccessDialog({
  open,
  hashId,
  desk,
  updated,
}: {
  open: boolean;
  hashId: string;
  desk?: boolean;
  updated?: boolean;
}) {
  const title = desk
    ? `${hashId} was saved`
    : updated
      ? `${hashId} is back with the desk`
      : `${hashId} is with the deal desk`;

  return (
    <Dialog
      open={open}
      onOpenChange={() => undefined}
      showCloseButton={false}
      className="sm:max-w-lg"
      title={title}
      description={
        desk
          ? "The listing stays in its current marketplace status until you publish, unpublish, or delete it from the desk."
          : "An advisor will review the anonymized teaser. You will get an email when it is published or if it needs a change."
      }
    >
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <CheckCircle2 className="size-7" aria-hidden />
        </div>
      </div>

      {desk ? null : (
        <ul className="space-y-2.5">
          <li className="flex gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left">
            <Eye className="mt-0.5 size-4 shrink-0 text-brand-sky" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Buyers see a hash ID</p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">
                The legal name stays off the marketplace. High-level figures go live only after approval.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left">
            <Lock className="mt-0.5 size-4 shrink-0 text-foreground/55" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">Books stay with the desk</p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">
                Line items, attachments, and the company name are not published on the teaser.
              </p>
            </div>
          </li>
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <SmoothButton asChild variant="candy" className="flex-1">
          <Link href={desk ? "/advisor/listings" : "/dashboard?submitted=listing"}>
            {desk ? "Back to sale requests" : "View my listings"}
          </Link>
        </SmoothButton>
        <SmoothButton asChild variant="outline" className="flex-1">
          <Link href={`/marketplace/${hashId}`}>{desk ? "Preview listing" : "Preview teaser"}</Link>
        </SmoothButton>
      </div>
    </Dialog>
  );
}
