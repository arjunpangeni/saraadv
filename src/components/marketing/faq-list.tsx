import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqList({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-16 sm:mt-20">
      <SectionHeading
        eyebrow="FAQ"
        title="Common questions"
        description="Straight answers before you write to the desk."
        align="center"
        className="mb-8 sm:mb-10"
      />
      <div className="mx-auto max-w-3xl space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-3xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)] open:border-primary/40"
          >
            <summary className="heading-soft cursor-pointer list-none text-pretty font-heading text-lg font-semibold tracking-[-0.015em] text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.question}
                <Plus
                  className="mt-0.5 size-5 shrink-0 text-primary transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </span>
            </summary>
            <p className="mt-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
