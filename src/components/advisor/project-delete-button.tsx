"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ProjectDeleteButton({
  projectId,
  title,
  redirectTo,
}: {
  projectId: string;
  title: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeProject() {
    setDeleting(true);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Unable to delete this project.");
      setOpen(false);
      return;
    }
    toast.success("Project deleted.");
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => setOpen(true)}>
        <Trash2 className="size-3.5" aria-hidden />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this project?"
        description={
          <>
            Delete <strong className="text-foreground">{title}</strong>? This removes the teaser, Vault,
            investor leads, and files. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void removeProject()}
        onClose={() => !deleting && setOpen(false)}
      />
    </>
  );
}
