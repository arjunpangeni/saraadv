"use client";

import { useState } from "react";
import SmoothButton from "@/components/smoothui/smooth-button";
import Dialog from "@/components/smoothui/dialog";
import { ProjectLeadForm } from "@/components/project-bank/lead-form";

export function ProjectLeadModal({
  projectId,
  projectSlug,
  compact,
}: {
  projectId: string;
  projectSlug: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const dialog = (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Request the dossier"
      showCloseButton
      className="max-h-[min(92vh,44rem)] overflow-y-auto sm:max-w-lg"
    >
      <ProjectLeadForm projectId={projectId} projectSlug={projectSlug} />
    </Dialog>
  );

  if (compact) {
    return (
      <aside className="rounded-2xl border border-brand-sky/30 bg-brand-sky-muted px-5 py-5">
        <p className="text-[11px] font-semibold tracking-wide text-brand-sky uppercase">Next step</p>
        <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-foreground">
          Request the dossier
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          Confirm your work email. After vetting and an NDA, SARA Advisors share the full dossier
          offline.
        </p>
        <SmoothButton variant="candy" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Request Full Project Dossier
        </SmoothButton>
        {dialog}
      </aside>
    );
  }

  return (
    <section className="mt-10 rounded-2xl border border-brand-sky/35 bg-brand-sky-muted px-6 py-8 text-center sm:px-10 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-brand-sky uppercase">Next step</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Request the full project dossier
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-foreground/70 sm:text-base">
        We will email a magic link to verify your work email. After vetting and an NDA, SARA Advisors
        will share the full dossier with you directly.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <SmoothButton variant="candy" size="lg" className="min-w-[16rem]" onClick={() => setOpen(true)}>
          Request Full Project Dossier
        </SmoothButton>
        <SmoothButton variant="outline" size="lg" onClick={() => setOpen(true)}>
          Connect with SARA Advisors
        </SmoothButton>
      </div>
      {dialog}
    </section>
  );
}
