import { Lock } from "lucide-react";

export function GatedVaultPreview() {
  return (
    <aside className="rounded-2xl border border-warning/30 bg-warning-bg/40 px-4 py-4">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-warning-fg uppercase">
        <Lock className="size-3.5" aria-hidden />
        Advisor only
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
        Exact site, founder name, WhatsApp, and login email stay with ASAR Partners. They are not
        shown on this teaser.
      </p>
    </aside>
  );
}
