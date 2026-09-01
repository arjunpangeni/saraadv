"use client";

import Link from "next/link";
import { CheckCircle2, Eye, Landmark, Lock } from "lucide-react";
import Dialog from "@/components/smoothui/dialog";
import SmoothButton from "@/components/smoothui/smooth-button";

export function ProjectSubmitSuccessDialog({
  open,
  title,
  slug,
}: {
  open: boolean;
  title: string;
  slug?: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => undefined}
      showCloseButton={false}
      className="sm:max-w-lg"
      title={title ? `"${title}" is with the deal desk` : "Your idea is with the deal desk"}
      description="An advisor will review the teaser. You will get an email when it is published or if it needs a change."
    >
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <CheckCircle2 className="size-7" aria-hidden />
        </div>
      </div>

      <ul className="space-y-2.5">
        <li className="flex gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left">
          <Eye className="mt-0.5 size-4 shrink-0 text-brand-sky" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Teaser stays private for now</p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">
              Title, pitch, and high-level numbers go live only after approval.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border border-warning/35 bg-warning-bg/40 px-3.5 py-3 text-left">
          <Lock className="mt-0.5 size-4 shrink-0 text-warning-fg" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Contact stays with the desk</p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">
              Your name, WhatsApp, and exact site are never shown on the public teaser.
            </p>
          </div>
        </li>
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SmoothButton asChild variant="candy" className="flex-1">
          <Link href="/dashboard?submitted=project">View my ideas</Link>
        </SmoothButton>
        {slug ? (
          <SmoothButton asChild variant="outline" className="flex-1">
            <Link href={`/project-bank/${slug}`}>
              <Landmark className="size-4" />
              Preview teaser
            </Link>
          </SmoothButton>
        ) : (
          <SmoothButton asChild variant="outline" className="flex-1">
            <Link href="/project-bank/discover">Browse Project Bank</Link>
          </SmoothButton>
        )}
      </div>
    </Dialog>
  );
}
