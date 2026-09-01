"use client";

import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { AnimatedGroup } from "@/components/smoothui/shared/animated-group";
import {
  SITE_OFFICE,
  googleMapsDirectionsUrl,
  googleMapsEmbedSrc,
} from "@/lib/seo";

const DETAILS = [
  {
    icon: MapPin,
    label: "Office",
    value: `${SITE_OFFICE.street}\n${SITE_OFFICE.streetLine}\n${SITE_OFFICE.locality}`,
    href: googleMapsDirectionsUrl(),
    external: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: SITE_OFFICE.email,
    href: `mailto:${SITE_OFFICE.email}`,
  },
  {
    icon: Phone,
    label: "Phone",
    value: SITE_OFFICE.phone,
    href: `tel:${SITE_OFFICE.phoneTel}`,
  },
  {
    icon: Clock,
    label: "Hours",
    value: SITE_OFFICE.hours,
  },
] as const;

export function ContactOfficeColumn() {
  return (
    <div className="flex h-full flex-col">
      <AnimatedGroup preset="blur-slide" className="space-y-0.5">
        {DETAILS.map((item) => {
          const Icon = item.icon;
          const body = (
            <>
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-sky-muted text-brand-sky">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium tracking-tight text-foreground/45">
                  {item.label}
                </span>
                <span className="mt-0.5 block whitespace-pre-line break-words text-sm font-medium leading-snug text-foreground">
                  {item.value}
                </span>
              </span>
            </>
          );

          return "href" in item && item.href ? (
            <a
              key={item.label}
              href={item.href}
              className="flex items-start gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-brand-sky-muted/50 sm:px-2"
              {...("external" in item && item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {body}
            </a>
          ) : (
            <div key={item.label} className="flex items-start gap-3 rounded-xl px-1.5 py-2 sm:px-2">
              {body}
            </div>
          );
        })}
      </AnimatedGroup>

      <div className="mt-3 overflow-hidden rounded-xl border border-border sm:mt-4 lg:min-h-0 lg:flex-1">
        <iframe
          title={`Map of ${SITE_OFFICE.name}, ${SITE_OFFICE.locality}`}
          src={googleMapsEmbedSrc()}
          className="h-40 w-full border-0 sm:h-48 lg:h-full lg:min-h-[200px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <a
        href={googleMapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-10 items-center gap-1 px-1.5 text-sm font-medium text-brand-sky hover:underline sm:min-h-0 sm:px-2 sm:text-xs"
      >
        Open in Google Maps
        <ArrowUpRight className="size-3.5" aria-hidden />
      </a>
    </div>
  );
}
