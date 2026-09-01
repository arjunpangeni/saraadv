"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SARA_TEAM, teamInitials, type SaraTeamMember } from "@/lib/team";

const STAGGER_DELAY = 0.1;

interface TeamGridProps {
  description?: string;
  members?: SaraTeamMember[];
  title?: string;
}

export function TeamGrid({
  title = "Our Team",
  description = "The strength of SARA Advisors lies in our highly qualified team of financial experts and strategists, dedicated to driving your business forward.",
  members = SARA_TEAM,
}: TeamGridProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section className="border-t border-border-subtle bg-surface-muted/50 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="People"
          title={title}
          description={description}
          className="mb-12 max-w-3xl sm:mb-14 [&>p:last-child]:max-w-3xl"
        />
        <motion.ul className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6" ref={ref}>
          {members.map((member, index) => (
            <motion.li
              animate={(() => {
                if (shouldReduceMotion) {
                  return { opacity: 1 };
                }
                return isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 };
              })()}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
              key={member.name}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { delay: index * STAGGER_DELAY, duration: 0.55 }
              }

            >
              <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden
                    className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-solid font-display text-lg font-extrabold tracking-tight text-white sm:size-16 sm:text-xl"
                  >
                    {teamInitials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-pretty font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                        {member.name}
                      </h3>
                      <span className="rounded-full bg-brand-sky-muted px-2.5 py-0.5 text-xs font-semibold tracking-tight text-brand-sky">
                        {member.credential}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium tracking-tight text-foreground/55">
                      {member.credentialLabel}
                    </p>
                    <p className="mt-1 text-sm font-medium tracking-tight text-brand-sky">
                      {member.focus}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-base leading-relaxed text-foreground/70 sm:text-lg">
                  {member.bio}
                </p>
              </article>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

export default TeamGrid;
