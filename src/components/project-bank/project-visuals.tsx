"use client";

import { useState } from "react";
import Image from "next/image";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectVisuals({
  title,
  imageUrls,
}: {
  title: string;
  imageUrls: string[];
}) {
  const urls = imageUrls.filter(Boolean);
  const [active, setActive] = useState(0);
  const current = urls[active] ?? urls[0];

  if (!current) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-border bg-surface-muted">
        <Landmark className="size-10 text-foreground/30" aria-hidden />
        <span className="sr-only">{title} concept visual</span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface-muted">
        <Image
          src={current}
          alt={`${title} visual`}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 480px, (min-width: 1024px) 420px, 100vw"
          priority
          unoptimized
        />
      </div>
      {urls.length > 1 ? (
        <div className="mt-2 flex gap-2">
          {urls.slice(0, 2).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show visual ${i + 1}`}
              aria-pressed={active === i}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border",
                active === i ? "border-brand-sky ring-2 ring-brand-sky/30" : "border-border opacity-80 hover:opacity-100"
              )}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="96px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
