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
      "Request Full Project Dossier — confirm your email with a magic link; ASAR vets you, arranges the NDA, and shares the Vault directly",
    ],
  },
] as const;

export function ProjectBankAudience() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <GlowHover
      className="grid gap-12 sm:grid-cols-2 sm:gap-5"
      glowIntensity={0.22}
      maskSize={320}
      items={AUDIENCE.map((s, i) => ({
        id: s.id,
        theme: { hue: 210, saturation: 78, lightness: 42 },
        element: (
          <motion.article
            className="group flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-6"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            transition={shouldReduceMotion ? { duration: 0 } : { ...SPRING, delay: i * 0.05 }}
            viewport={{ margin: "-80px", once: true }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          >
            <h3 className="heading-soft text-pretty font-heading text-xl font-semibold tracking-[-0.015em] text-foreground lg:text-[1.45rem]">
              {s.heading}
            </h3>
            <ul className="mt-3 flex-1 space-y-2.5">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground"
                >
                  <CheckCircle2 className="mt-1.5 size-5 shrink-0 text-primary" aria-hidden />
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
