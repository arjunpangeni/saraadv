"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormError, StatusBanner } from "@/components/ui/status-banner";
import { useAnalytics } from "@/lib/use-analytics";
import { ShieldCheck } from "lucide-react";
import { SCRUTINY_CTA_LABEL } from "@/types/listing";
import { ListingLeadModal, ListingLeadReceived } from "@/components/marketplace/listing-lead-modal";
import type { ListingLeadPrefill } from "@/lib/listing-lead-session";

export function ViewTracker({ listingId }: { listingId: string }) {
  const { track } = useAnalytics();
  useEffect(() => {
    track("listing_view", { entityType: "Listing", entityId: listingId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);
  return null;
}

export function InvestorVerificationBanner() {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "ADMIN" && session?.user.role !== "ADVISOR") {
      void update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!session?.user) return null;
  const role = session.user.role;
  if (role === "ADMIN" || role === "ADVISOR") return null;
  if (session.user.verified) return null;

  return (
    <StatusBanner variant="warning" title="Investor verification pending" className="mt-4 mb-0">
      Your account must be verified by ASAR Partners before you can sign NDAs, download teasers, or open
      another company’s data room. Contact{" "}
      <a href="mailto:advisor@asarpartners.com" className="font-medium underline">
        advisor@asarpartners.com
      </a>
      .
    </StatusBanner>
  );
}

export function RequestScrutinyButton({ listingId, hashId }: { listingId: string; hashId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (status !== "authenticated") {
      return;
    }
    if (
      session?.user &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "ADVISOR" &&
      !session.user.verified
    ) {
      setError("Investor verification required before requesting deep scrutiny.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/request-scrutiny`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Unable to proceed. Please try again.";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Scrutiny request started.");
    router.push(`/marketplace/${hashId}/unlock`);
  }

  return (
    <div>
      <Button variant="sky" size="lg" onClick={onClick} disabled={loading} className="h-auto min-h-11 whitespace-normal py-2 text-left leading-snug">
        {loading ? "Preparing…" : SCRUTINY_CTA_LABEL}
      </Button>
      <FormError className="mt-2 text-xs">{error}</FormError>
    </div>
  );
}

export function TeaserDownloadButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/teaser`);
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || "Download failed";
      setError(message);
      toast.error(message);
      return;
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition");
    const filename =
      contentDisposition?.match(/filename="([^"]+)"/i)?.[1] || "asar-listing-teaser.pdf";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Teaser download started.");
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onClick} disabled={loading}>
        {loading ? "Generating…" : "Download teaser (PDF)"}
      </Button>
      <FormError className="mt-1 text-xs">{error}</FormError>
    </div>
  );
}

export function AccessLevelBadge({
  canViewFull,
  hashId,
  listingId,
  leadRequested,
  leadName,
  prefill,
}: {
  canViewFull: boolean;
  hashId: string;
  listingId: string;
  leadRequested?: boolean;
  leadName?: string;
  prefill?: ListingLeadPrefill;
}) {
  return (
    <aside className="card-elevated space-y-4 p-6 lg:sticky lg:top-[5.5rem]">
      <div className="flex items-center gap-2">
        <ShieldCheck className={`h-5 w-5 ${canViewFull ? "text-success-fg" : "text-muted-foreground"}`} />
        <h2 className="font-semibold text-foreground">Access level</h2>
      </div>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          canViewFull ? "bg-success-bg text-success-fg" : "bg-surface-muted text-muted-foreground"
        }`}
      >
        {canViewFull ? "Full data room unlocked" : "Anonymized preview"}
      </span>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {canViewFull
          ? "You have full access to financials, projections, compliance records, and documents."
          : "Public visitors see industry, high-level financials, and location. Confirm your work email to request the full profile — no buyer account."}
      </p>

      {!canViewFull ? (
        leadRequested ? (
          <ListingLeadReceived hashId={hashId} name={leadName} />
        ) : (
          <ListingLeadModal listingId={listingId} hashId={hashId} prefill={prefill} />
        )
      ) : null}

      <Link href="/marketplace" className="inline-block text-xs font-medium text-brand-sky hover:underline">
        Browse more opportunities →
      </Link>
    </aside>
  );
}

export function BackToMarketplaceLink({ light }: { light?: boolean }) {
  return (
    <Link
      href="/marketplace"
      className={`inline-flex items-center gap-1 text-sm font-medium hover:underline ${
        light ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-brand-sky"
      }`}
    >
      ← Back to marketplace
    </Link>
  );
}

export function ScrutinyCtaPanel({
  listingId,
  hashId,
  isPublished,
}: {
  listingId: string;
  hashId: string;
  isPublished: boolean;
}) {
  if (!isPublished) return null;
  return <ListingLeadModal compact listingId={listingId} hashId={hashId} />;
}
