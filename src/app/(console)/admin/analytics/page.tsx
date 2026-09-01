import type { Metadata } from "next";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/console/page-header";
import { FilterTabs } from "@/components/console/filter-tabs";
import { DashboardStats } from "@/components/console/dashboard-stats";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import {
  getBuySellFunnel,
  getProjectBankFunnel,
  parseAnalyticsRange,
  rangeLabel,
  rangeToSinceDays,
  type AnalyticsRange,
} from "@/lib/analytics";
import { getGa4Traffic } from "@/lib/ga4-traffic";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Platform analytics",
};

function conversionRate(funnel: { count: number }[]) {
  if (funnel[0].count <= 0) return "—";
  const rate = Math.round((funnel[funnel.length - 1].count / funnel[0].count) * 1000) / 10;
  return `${rate}%`;
}

function trafficValue(value: number | null) {
  return value == null ? "—" : String(value);
}

function trafficCaption(
  traffic: Awaited<ReturnType<typeof getGa4Traffic>>,
  range: AnalyticsRange
) {
  if (traffic.status === "unconfigured") return null;
  if (traffic.status === "error") {
    return `Google Analytics could not load. ${traffic.message}`;
  }
  return `${rangeLabel(range)} · updated ${new Date(traffic.fetchedAt).toLocaleString()} · cached 2 minutes`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range = parseAnalyticsRange(rangeParam);
  const sinceDays = rangeToSinceDays(range);

  const [buySellFunnel, projectFunnel, listingCount, ticketCount, projectLeadCount, publishedProjects, traffic] =
    await Promise.all([
      getBuySellFunnel(sinceDays),
      getProjectBankFunnel(sinceDays),
      prisma.listing.count(),
      prisma.crmTicket.count(),
      prisma.projectLead.count(),
      prisma.projectListing.count({ where: { status: "PUBLISHED" } }),
      getGa4Traffic(range),
    ]);

  const liveUsers = traffic.status === "ok" ? traffic.liveUsers : null;
  const sessions = traffic.status === "ok" ? traffic.sessions : null;
  const pageViews = traffic.status === "ok" ? traffic.pageViews : null;
  const caption = trafficCaption(traffic, range);

  return (
    <main className="flex-1">
      <PageHeader
        compact
        title="Platform analytics"
        description="Traffic and conversion for Buy/Sell and Project Bank."
      />
      <div className="container-console space-y-8 py-5 sm:py-6">
        <FilterTabs
          items={[
            { href: "/admin/analytics?range=7d", label: "Last 7 days", active: range === "7d" },
            { href: "/admin/analytics?range=30d", label: "Last 30 days", active: range === "30d" },
            { href: "/admin/analytics?range=all", label: "All time", active: range === "all" },
          ]}
        />

        <section className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
            Conversion
          </h2>
          <DashboardStats
            stats={[
              {
                label: "Buy/Sell conversion",
                value: conversionRate(buySellFunnel),
                description: "Listing view to CRM ticket",
              },
              {
                label: "Project Bank conversion",
                value: conversionRate(projectFunnel),
                description: "Project view to verified request",
              },
            ]}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
            Traffic
          </h2>
          <DashboardStats
            stats={[
              {
                label: "Live visitors",
                value: trafficValue(liveUsers),
                description: "Right now",
              },
              {
                label: "Sessions",
                value: trafficValue(sessions),
                description: rangeLabel(range),
              },
              {
                label: "Page views",
                value: trafficValue(pageViews),
                description: rangeLabel(range),
              },
            ]}
          />
          {caption ? <p className="text-xs leading-relaxed text-foreground/45">{caption}</p> : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-foreground/55 uppercase">
            Pipeline
          </h2>
          <DashboardStats
            stats={[
              { label: "Total listings", value: String(listingCount), href: "/advisor/listings" },
              {
                label: "Published projects",
                value: String(publishedProjects),
                href: "/advisor/project-bank?status=live",
              },
              {
                label: "Project Bank leads",
                value: String(projectLeadCount),
                href: "/advisor/crm?tab=investors",
              },
              { label: "CRM tickets", value: String(ticketCount), href: "/advisor/crm" },
            ]}
          />
        </section>

        <Card>
          <CardContent className="pt-0">
            <CardTitle>Buy/Sell funnel</CardTitle>
            <div className="mt-6">
              <FunnelChart data={buySellFunnel} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <CardTitle>Project Bank funnel</CardTitle>
            <div className="mt-6">
              <FunnelChart data={projectFunnel} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
