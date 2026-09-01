import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/console/page-header";
import { DeskHome } from "@/components/console/desk-home";
import { DashboardOwnerHome } from "@/components/console/dashboard-owner";
import { SellerDashboard } from "@/components/console/seller-dashboard";
import { BuyerDashboard } from "@/components/console/buyer-dashboard";
import SmoothButton from "@/components/smoothui/smooth-button";
import { prisma } from "@/lib/prisma";
import { formatNpr } from "@/lib/calc";
import { DashboardStats } from "@/components/console/dashboard-stats";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { crmHref, crmViewStatuses } from "@/components/advisor/crm-desk";
import { inquiriesHref } from "@/components/advisor/inquiries-desk";
import { listingDeskHref } from "@/components/advisor/listings-desk";
import { projectBankHref } from "@/components/advisor/project-bank-desk";
import { setupDeskHref } from "@/components/advisor/business-setup-desk";

export const metadata: Metadata = {
  title: "Dashboard",
};

const PULSE_SIZE = 5;
const ACTION_STATUSES = crmViewStatuses("action");
const OPEN_SETUP_STATUSES = ["INTAKE", "RULES_GENERATED", "IN_PROGRESS"] as const;

const ROLE_LABELS: Record<string, string> = {
  SELLER: "Seller",
  BUYER: "Buyer",
  ENTREPRENEUR: "Entrepreneur",
  INVESTOR: "Investor",
  ADVISOR: "Advisor",
  ADMIN: "Admin",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; reason?: string; from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { submitted, reason, from } = await searchParams;
  const role = session.user.role;
  const isDesk = role === "ADVISOR" || role === "ADMIN";
  const isBuyer = role === "BUYER";
  const isSeller = role === "SELLER";
  const isEntrepreneur = role === "ENTREPRENEUR";

  const [
    myListings,
    myProjects,
    messages,
    newMessageCount,
    setups,
    newSetupCount,
    pendingListingCount,
    pendingIdeaCount,
    deskSaleRequests,
    deskProjectIdeas,
    buyerLeads,
    investorLeads,
    buyerActionCount,
    investorActionCount,
    buyerNdas,
    buyerUnlocks,
  ] = await Promise.all([
    isSeller
      ? prisma.listing.findMany({
          where: { ownerId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: { dealTerms: true },
          take: 50,
        })
      : Promise.resolve([]),
    isEntrepreneur
      ? prisma.projectListing.findMany({
          where: { ownerId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    isDesk
      ? prisma.serviceInquiry.findMany({
          where: { status: "NEW" },
          orderBy: { createdAt: "desc" },
          take: PULSE_SIZE,
        })
      : Promise.resolve([]),
    isDesk ? prisma.serviceInquiry.count({ where: { status: "NEW" } }) : Promise.resolve(0),
    isDesk
      ? prisma.businessSetup.findMany({
          where: { status: { in: [...OPEN_SETUP_STATUSES] } },
          orderBy: { createdAt: "desc" },
          take: PULSE_SIZE,
        })
      : Promise.resolve([]),
    isDesk
      ? prisma.businessSetup.count({
          where: { status: { in: [...OPEN_SETUP_STATUSES] } },
        })
      : Promise.resolve(0),
    isDesk ? prisma.listing.count({ where: { status: "PENDING_REVIEW" } }) : Promise.resolve(0),
    isDesk
      ? prisma.projectListing.count({ where: { status: "PENDING_REVIEW" } })
      : Promise.resolve(0),
    isDesk
      ? prisma.listing.findMany({
          where: { status: "PENDING_REVIEW" },
          orderBy: { createdAt: "desc" },
          include: {
            dealTerms: true,
            owner: { select: { name: true, email: true } },
          },
          take: PULSE_SIZE,
        })
      : Promise.resolve([]),
    isDesk
      ? prisma.projectListing.findMany({
          where: { status: "PENDING_REVIEW" },
          orderBy: { createdAt: "desc" },
          take: PULSE_SIZE,
          select: { id: true, title: true, sector: true, createdAt: true },
        })
      : Promise.resolve([]),
    isDesk
      ? prisma.listingLead.findMany({
          where: { status: { in: ACTION_STATUSES } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            name: true,
            firm: true,
            status: true,
            createdAt: true,
            listing: { select: { hashId: true } },
          },
        })
      : Promise.resolve([]),
    isDesk
      ? prisma.projectLead.findMany({
          where: { status: { in: ACTION_STATUSES } },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            name: true,
            firm: true,
            status: true,
            createdAt: true,
            project: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
    isDesk
      ? prisma.listingLead.count({ where: { status: { in: ACTION_STATUSES } } })
      : Promise.resolve(0),
    isDesk
      ? prisma.projectLead.count({ where: { status: { in: ACTION_STATUSES } } })
      : Promise.resolve(0),
    isBuyer
      ? prisma.ndaAgreement.findMany({
          where: { buyerId: session.user.id },
          orderBy: { signedAt: "desc" },
          take: 50,
          include: { listing: { select: { id: true, hashId: true, industry: true } } },
        })
      : Promise.resolve([]),
    isBuyer
      ? prisma.unlockRequest.findMany({
          where: { buyerId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { listing: { select: { id: true, hashId: true, industry: true } } },
        })
      : Promise.resolve([]),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const buyerInterests = (() => {
    const byListing = new Map<
      string,
      { listingId: string; hashId: string; industry: string; ndaSignedAt: Date | null; requestedAt: Date }
    >();
    for (const row of buyerUnlocks) {
      byListing.set(row.listingId, {
        listingId: row.listingId,
        hashId: row.listing.hashId,
        industry: row.listing.industry,
        ndaSignedAt: null,
        requestedAt: row.createdAt,
      });
    }
    for (const row of buyerNdas) {
      const existing = byListing.get(row.listingId);
      byListing.set(row.listingId, {
        listingId: row.listingId,
        hashId: row.listing.hashId,
        industry: row.listing.industry,
        ndaSignedAt: row.signedAt,
        requestedAt: existing?.requestedAt ?? row.signedAt,
      });
    }
    return [...byListing.values()].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  })();

  const roleActions =
    isDesk ? (
      <SmoothButton asChild variant="candy" size="sm">
        <Link href={inquiriesHref({ status: "NEW" })}>Open inbox</Link>
      </SmoothButton>
    ) : isSeller ? (
      <SmoothButton asChild variant="candy" size="sm">
        <Link href="/sell/new">List a business</Link>
      </SmoothButton>
    ) : isEntrepreneur ? (
      <SmoothButton asChild variant="candy" size="sm">
        <Link href="/project-bank/new">List your idea</Link>
      </SmoothButton>
    ) : isBuyer ? (
      <SmoothButton asChild variant="candy" size="sm">
        <Link href="/marketplace">Browse marketplace</Link>
      </SmoothButton>
    ) : role === "INVESTOR" ? (
      <SmoothButton asChild variant="candy" size="sm">
        <Link href="/project-bank/discover">Discover projects</Link>
      </SmoothButton>
    ) : null;

  const deskStats = [
    { value: String(newMessageCount), label: "Inquiries", href: inquiriesHref({ status: "NEW" }) },
    { value: String(newSetupCount), label: "Setups", href: setupDeskHref({}) },
    { value: String(pendingListingCount), label: "Sale requests", href: listingDeskHref({}) },
    { value: String(pendingIdeaCount), label: "Project ideas", href: projectBankHref({}) },
    { value: String(buyerActionCount), label: "Buyer leads", href: crmHref({ tab: "buyers" }) },
    { value: String(investorActionCount), label: "Investor leads", href: crmHref({ tab: "investors" }) },
  ];

  const crmLeads = [
    ...buyerLeads.map((lead) => ({
      id: lead.id,
      kind: "buyers" as const,
      name: lead.name,
      firm: lead.firm,
      status: lead.status,
      target: lead.listing.hashId,
      createdAt: formatRelativeTime(lead.createdAt),
      sort: lead.createdAt.getTime(),
    })),
    ...investorLeads.map((lead) => ({
      id: lead.id,
      kind: "investors" as const,
      name: lead.name,
      firm: lead.firm,
      status: lead.status,
      target: lead.project.title,
      createdAt: formatRelativeTime(lead.createdAt),
      sort: lead.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b.sort - a.sort)
    .slice(0, PULSE_SIZE)
    .map(({ sort: _sort, ...lead }) => lead);

  return (
    <main className="flex-1">
      <PageHeader compact title={`Welcome, ${firstName}`} actions={roleActions} />

      <div className="container-console mx-auto max-w-5xl space-y-4 py-5">
        {reason === "role" && (
          <div
            role="status"
            className="rounded-xl border border-border bg-warning-bg px-4 py-2.5 text-sm leading-relaxed text-warning-fg"
          >
            This account ({ROLE_LABELS[role] ?? role}) cannot open {from || "that page"}. Use a Seller
            account to list a business, or an Entrepreneur account to list a Project Bank idea.{" "}
            {role !== "ADMIN" && role !== "ADVISOR" ? (
              <Link
                href={`/onboarding/role?callbackUrl=${encodeURIComponent(from || "/dashboard")}`}
                className="font-semibold underline"
              >
                Change account type
              </Link>
            ) : null}
          </div>
        )}
        {submitted === "listing" && !isDesk && (
          <div
            role="status"
            className="rounded-xl border border-border bg-success-bg px-4 py-2.5 text-sm leading-relaxed text-success-fg"
          >
            Your listing has been submitted. The desk will review it before it is published.
          </div>
        )}
        {submitted === "project" && !isDesk && (
          <div
            role="status"
            className="rounded-xl border border-border bg-success-bg px-4 py-2.5 text-sm leading-relaxed text-success-fg"
          >
            Your project teaser has been submitted. The desk will review it before it is published.
          </div>
        )}

        {isDesk ? <DashboardStats stats={deskStats} /> : null}

        {isDesk ? (
          <DeskHome
            messages={messages.map((m) => ({
              id: m.id,
              type: m.type,
              contactName: m.contactName,
              subject: m.subject,
              status: m.status,
              createdAt: formatRelativeTime(m.createdAt),
            }))}
            newMessageCount={newMessageCount}
            setups={setups.map((s) => ({
              id: s.id,
              name: s.name,
              contactName: s.contactName,
              status: s.status,
              submittedAt: formatRelativeTime(s.createdAt),
            }))}
            newSetupCount={newSetupCount}
            saleRequests={deskSaleRequests.map((l) => ({
              listingId: l.id,
              hashId: l.hashId,
              industry: l.industry,
              asking: l.dealTerms ? formatNpr(Number(l.dealTerms.askingPriceNpr)) : "On request",
              sellerName: l.owner.name || l.owner.email,
              submittedAt: formatRelativeTime(l.createdAt),
            }))}
            pendingSaleCount={pendingListingCount}
            projectIdeas={deskProjectIdeas.map((p) => ({
              id: p.id,
              title: p.title,
              sector: p.sector,
              createdAt: formatRelativeTime(p.createdAt),
            }))}
            pendingIdeaCount={pendingIdeaCount}
            crmLeads={crmLeads}
            buyerActionCount={buyerActionCount}
            investorActionCount={investorActionCount}
          />
        ) : isSeller ? (
          <SellerDashboard
            listings={myListings.map((l) => ({
              id: l.id,
              hashId: l.hashId,
              industry: l.industry,
              status: l.status,
              asking: l.dealTerms ? formatNpr(Number(l.dealTerms.askingPriceNpr)) : "—",
              createdAt: formatRelativeTime(l.createdAt),
              reviewNotes: l.reviewNotes,
            }))}
          />
        ) : isBuyer ? (
          <BuyerDashboard
            interests={buyerInterests.map((item) => ({
              listingId: item.listingId,
              hashId: item.hashId,
              industry: item.industry,
              ndaSignedAt: item.ndaSignedAt ? formatRelativeTime(item.ndaSignedAt) : null,
              requestedAt: formatRelativeTime(item.requestedAt),
            }))}
          />
        ) : (
          <DashboardOwnerHome
            role={role}
            listings={[]}
            projects={myProjects.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              sector: p.sector,
              broadRegion: p.broadRegion,
              status: p.status,
              createdAt: formatRelativeTime(p.createdAt),
              reviewNotes: p.reviewNotes,
            }))}
          />
        )}
      </div>
    </main>
  );
}
