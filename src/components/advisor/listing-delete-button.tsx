"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ListingDeleteButton({
  listingId,
  hashId,
  companyName,
}: {
  listingId: string;
  hashId: string;
  companyName?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeListing() {
    setDeleting(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      toast.error("Unable to delete this sale request.");
      setOpen(false);
      return;
    }
    toast.success("Sale request deleted.");
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
        title="Delete this sale request?"
        description={
          <>
            Remove <strong className="text-foreground">{companyName || hashId}</strong> ({hashId}) from
            the marketplace. Buyer leads tied to this listing are removed. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={() => void removeListing()}
        onClose={() => !deleting && setOpen(false)}
      />
    </>
  );
}
