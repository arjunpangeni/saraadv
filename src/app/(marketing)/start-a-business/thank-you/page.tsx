import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import SmoothButton from "@/components/smoothui/smooth-button";

export const metadata: Metadata = {
  title: "Inquiry received",
  robots: { index: false, follow: false },
};

export default async function StartABusinessThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const displayName = name?.trim() || "there";

  return (
    <main className="flex-1">
      <div className="container-narrow py-20 sm:py-28">
        <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-[var(--shadow-card)] sm:px-10 sm:py-14">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-tz-green text-tz-green-deep">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="heading-soft text-pretty font-heading text-[1.7rem] font-semibold tracking-[-0.015em] text-foreground sm:text-[2rem] md:text-[2.35rem]">
            Thank you, {displayName}
          </h1>
          <p className="mt-4 text-pretty text-[1.05rem] leading-[1.75] text-muted-foreground">
            We received your Start a Business inquiry. If you just submitted from this browser, open your
            personalized registration guide. A ASAR Partners team member will also contact you using the
            phone number and email you provided.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <SmoothButton asChild variant="candy" size="lg">
              <Link href="/start-a-business/guide">View your guide</Link>
            </SmoothButton>
            <SmoothButton asChild variant="outline" size="lg">
              <Link href="/start-a-business">About this service</Link>
            </SmoothButton>
          </div>
        </div>
      </div>
    </main>
  );
}
