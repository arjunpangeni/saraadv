"use client";

import { CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import GlowHover from "@/components/smoothui/glow-hover-card";

const SPRING = { bounce: 0.1, duration: 0.25, type: "spring" as const };

const AUDIENCE = [
  {
    id: "entrepreneurs",
    heading: "For Entrepreneurs",
    items: [
      "Project curation — aggregating, vetting, and refining business plans and feasibility studies",
      "List your idea as a teaser — elevator pitch and high-level financials only, never the full plan",
      "Visual storytelling — concept renders, architectural sketches, mood boards",
    ],
  },
  {
    id: "investors",
    heading: "For Investors",
    items: [
      "Discovery grid — filterable project cards by sector and investment size",
      "High-level financials — CAPEX range, target ROI/IRR, funding stage",
      "Request Full Project Dossier — confirm your email with a magic link; SARA vets you, arranges the NDA, and shares the Vault directly",
    ],
  },
] as const;

export function ProjectBankAudience() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <GlowHover
      className="grid gap-4 sm:grid-cols-2 sm:gap-5"
      glowIntensity={0.18}
      maskSize={280}
      items={AUDIENCE.map((s, i) => ({
        id: s.id,
        theme: { hue: 210, saturation: 78, lightness: 42 },
        element: (
          <motion.article
            className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING, delay: i * 0.05 }}
            viewport={{ margin: "-80px", once: true }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          >
            <p className="text-sm font-medium tracking-tight text-brand-sky">Advisory</p>
            <h3 className="mt-1 text-pretty font-display text-xl font-extrabold tracking-tight text-foreground">
              {s.heading}
            </h3>
            <ul className="mt-3 flex-1 space-y-2">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/70">
                  <CheckCircle2 className="mt-1.5 size-5 shrink-0 text-brand-sky" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ),
      }))}
    />
  );
}
