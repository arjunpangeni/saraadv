import { Lock } from "lucide-react";

const GATED = [
  "Line-item balance sheets, P&L, and cash flows",
  "Three-year projections, CAPEX, and strategic assumptions",
  "Asset revaluations, compliance filings, and IP",
  "Risk log, headcount, and regulatory attachments",
];

export function GatedListingPreview() {
  return (
    <aside className="rounded-2xl border border-warning/30 bg-warning-bg/40 px-4 py-4">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-warning-fg uppercase">
        <Lock className="size-3.5" aria-hidden />
        NDA required
      </p>
      <p className="mt-1.5 text-sm font-medium text-foreground">Full data room stays locked</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/70">
        {GATED.map((item) => (
          <li key={item} className="flex gap-2">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-warning-fg/80" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
