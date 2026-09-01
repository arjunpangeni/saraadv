"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListingDeleteButton } from "@/components/advisor/listing-delete-button";

type NextStatus = "PUBLISHED" | "WITHDRAWN" | "PENDING_REVIEW";

export function ListingReviewActions({
  listingId,
  hashId,
  status,
  companyName,
}: {
  listingId: string;
  hashId: string;
  status: string;
  companyName?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState<NextStatus | null>(null);
  const pending = status === "PENDING_REVIEW" || status === "DRAFT";
  const label = companyName || hashId;

  async function updateStatus(next: NextStatus) {
    setLoading(next);
    const res = await fetch(`/api/listings/${listingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, reviewNotes: notes || undefined }),
    });
    setLoading(null);
    setConfirm(null);
    if (!res.ok) {
      toast.error("Unable to update this sale request.");
      return;
    }
    toast.success(
      next === "PUBLISHED"
        ? "Sale request is live."
        : next === "PENDING_REVIEW"
          ? "Sale request unpublished."
          : "Sale request rejected."
    );
    router.refresh();
  }

  const dialog = (
    <ConfirmDialog
      open={confirm !== null}
      title={
        confirm === "PUBLISHED"
          ? "Publish this listing?"
          : confirm === "PENDING_REVIEW"
            ? "Unpublish this listing?"
            : "Reject this sale request?"
      }
      description={
        confirm === "PUBLISHED" ? (
          <>
            <strong className="text-foreground">{label}</strong> ({hashId}) will go live on the
            marketplace. Buyers will be able to discover the anonymized teaser.
          </>
        ) : confirm === "PENDING_REVIEW" ? (
          <>
            Take <strong className="text-foreground">{label}</strong> ({hashId}) off the marketplace. It
            returns to the pending queue.
          </>
        ) : (
          <>
            Reject <strong className="text-foreground">{label}</strong> ({hashId}). The seller will be
            notified. You can publish it later if you change your mind.
          </>
        )
      }
      confirmLabel={
        confirm === "PUBLISHED" ? "Publish" : confirm === "PENDING_REVIEW" ? "Unpublish" : "Reject"
      }
      destructive={confirm === "WITHDRAWN"}
      loading={loading !== null}
      onConfirm={() => confirm && void updateStatus(confirm)}
      onClose={() => loading === null && setConfirm(null)}
    >
      {confirm === "WITHDRAWN" ? (
        <Textarea
          placeholder="Review notes for the seller (optional)…"
          className="min-h-[72px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      ) : null}
    </ConfirmDialog>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "PUBLISHED" ? (
        <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => setConfirm("PENDING_REVIEW")}>
          {loading === "PENDING_REVIEW" ? "Unpublishing…" : "Unpublish"}
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => setConfirm("PUBLISHED")}>
          {loading === "PUBLISHED" ? "Publishing…" : status === "WITHDRAWN" ? "Publish again" : "Approve & publish"}
        </Button>
      )}
      {pending ? (
        <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => setConfirm("WITHDRAWN")}>
          Reject
        </Button>
      ) : null}
      <Button asChild variant="outline" size="sm">
        <Link
          href={`/advisor/listings/${listingId}/edit?from=${
            status === "PUBLISHED" ? "live" : status === "WITHDRAWN" ? "rejected" : "pending"
          }`}
        >
          Edit data
        </Link>
      </Button>
      <ListingDeleteButton listingId={listingId} hashId={hashId} companyName={companyName} />
      {dialog}
    </div>
  );
}
