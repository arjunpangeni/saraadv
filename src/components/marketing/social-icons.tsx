import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition hover:scale-105 hover:opacity-90"
    >
      {children}
    </a>
  );
}

export function SocialIcons({ className }: { className?: string }) {
  const { instagram, facebook, linkedin, x } = siteConfig.links.social;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <IconLink href={instagram} label="ASAR Partners on Instagram">
        <span
          className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-[7px]"
          style={{
            background:
              "radial-gradient(circle at 30% 107%, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
          }}
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
            <rect
              x="3.4"
              y="3.4"
              width="17.2"
              height="17.2"
              rx="5"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="4.1" fill="none" stroke="#fff" strokeWidth="2" />
            <circle cx="17.15" cy="6.9" r="1.25" fill="#fff" />
          </svg>
        </span>
      </IconLink>
      <IconLink href={facebook} label="ASAR Partners on Facebook">
        <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
          <circle cx="12" cy="12" r="12" fill="#1877F2" />
          <path
            fill="#fff"
            d="M16.67 15.4l.53-3.47h-3.33V9.68c0-.95.47-1.87 1.96-1.87h1.51V4.86s-1.37-.24-2.69-.24c-2.74 0-4.53 1.66-4.53 4.67v2.89H7.08v3.47h3.05v8.38a12.2 12.2 0 0 0 3.75 0V15.4h2.79z"
          />
        </svg>
      </IconLink>
      <IconLink href={linkedin} label="ASAR Partners on LinkedIn">
        <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
          <path
            fill="#0A66C2"
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
          />
        </svg>
      </IconLink>
      <IconLink href={x} label="ASAR Partners on X">
        <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
          <rect width="24" height="24" rx="5" fill="#000" />
          <g transform="translate(4.2 4.2) scale(0.65)">
            <path
              fill="#fff"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.437 6.231H2.71l7.725-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </g>
        </svg>
      </IconLink>
    </div>
  );
}
