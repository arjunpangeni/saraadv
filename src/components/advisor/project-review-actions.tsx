"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectDeleteButton } from "@/components/advisor/project-delete-button";

type NextStatus = "PUBLISHED" | "REJECTED" | "PENDING_REVIEW";

export function ProjectReviewActions({
  projectId,
  slug,
  status,
  title,
  redirectTo,
  compact,
}: {
  projectId: string;
  slug: string;
  status: string;
  title: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState<NextStatus | null>(null);
  const pending = status === "PENDING_REVIEW" || status === "DRAFT";

  async function updateStatus(next: NextStatus) {
    setLoading(next);
    const res = await fetch(`/api/projects/${projectId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, reviewNotes: notes || undefined }),
    });
    setLoading(null);
    setConfirm(null);
    if (!res.ok) {
      toast.error("Unable to update project status.");
      return;
    }
    toast.success(
      next === "PUBLISHED"
        ? "Project published."
        : next === "PENDING_REVIEW"
          ? "Project unpublished."
          : "Project rejected."
    );
    router.refresh();
  }

  const deleteButton = <ProjectDeleteButton projectId={projectId} title={title} redirectTo={redirectTo} />;

  const dialog = (
    <ConfirmDialog
      open={confirm !== null}
      title={
        confirm === "PUBLISHED"
          ? "Publish this teaser?"
          : confirm === "PENDING_REVIEW"
            ? "Unpublish this teaser?"
            : "Reject this idea?"
      }
      description={
        confirm === "PUBLISHED" ? (
          <>
            <strong className="text-foreground">{title}</strong> will go live on Project Bank. Investors will
            be able to discover it and request the dossier.
          </>
        ) : confirm === "PENDING_REVIEW" ? (
          <>
            Take <strong className="text-foreground">{title}</strong> off Project Bank. It returns to the
            pending queue.
          </>
        ) : (
          <>
            Reject <strong className="text-foreground">{title}</strong>. The entrepreneur will be notified.
            This can be published later if you change your mind.
          </>
        )
      }
      confirmLabel={
        confirm === "PUBLISHED" ? "Publish" : confirm === "PENDING_REVIEW" ? "Unpublish" : "Reject"
      }
      destructive={confirm === "REJECTED"}
      loading={loading !== null}
      onConfirm={() => confirm && void updateStatus(confirm)}
      onClose={() => loading === null && setConfirm(null)}
    >
      {confirm === "REJECTED" ? (
        <Textarea
          placeholder="Review notes for the entrepreneur (optional)…"
          className="min-h-[72px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      ) : null}
    </ConfirmDialog>
  );

  if (status === "PUBLISHED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {compact ? null : <Badge variant="success">Live on Project Bank</Badge>}
        <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => setConfirm("PENDING_REVIEW")}>
          {loading === "PENDING_REVIEW" ? "Unpublishing…" : "Unpublish"}
        </Button>
        <a href={`/project-bank/${slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            View public teaser
          </Button>
        </a>
        {deleteButton}
        {dialog}
      </div>
    );
  }

  if (status === "ARCHIVED" || status === "REJECTED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {compact ? null : (
          <Badge variant="default">{status === "REJECTED" ? "Rejected" : "Archived"}</Badge>
        )}
        <Button variant="sky" size="sm" disabled={loading !== null} onClick={() => setConfirm("PUBLISHED")}>
          {loading === "PUBLISHED" ? "Publishing…" : "Publish again"}
        </Button>
        {deleteButton}
        {dialog}
      </div>
    );
  }

  return (
    <div className={compact ? undefined : "space-y-3"}>
      {compact ? null : (
        <Textarea
          placeholder="Review notes for entrepreneur (optional)…"
          className="min-h-[72px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => setConfirm("PUBLISHED")}>
          {loading === "PUBLISHED" ? "Publishing…" : pending ? "Approve & publish" : "Publish"}
        </Button>
        {pending ? (
          <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => setConfirm("REJECTED")}>
            Reject
          </Button>
        ) : null}
        {compact ? null : (
          <a href={`/project-bank/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              Preview teaser
            </Button>
          </a>
        )}
        {deleteButton}
      </div>
      {dialog}
    </div>
  );
}
