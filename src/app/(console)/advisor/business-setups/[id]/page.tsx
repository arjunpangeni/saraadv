import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/page-header";
import SmoothButton from "@/components/smoothui/smooth-button";
import { BusinessSetupInquiryDetail } from "@/components/advisor/business-setup-inquiry-detail";
import { parseSetupDeskView, setupDeskHref } from "@/components/advisor/business-setup-desk";
import { getBusinessSetupForAdvisor, parseStoredIntakeExtras } from "@/lib/business-setup";
import { formatRelativeTime } from "@/lib/format-relative-time";

export default async function AdvisorBusinessSetupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from: fromParam } = await searchParams;
  const backHref = setupDeskHref({ view: parseSetupDeskView(fromParam) });
  const setup = await getBusinessSetupForAdvisor(id);
  if (!setup) notFound();

  const extras = parseStoredIntakeExtras(setup.sectorTags);

  return (
    <main className="flex-1 bg-background">
      <PageHeader
        compact
        title={setup.name}
        description={`${setup.contactName} · ${setup.email}`}
        actions={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={backHref}>Back to queue</Link>
          </SmoothButton>
        }
      />
      <div className="container-console max-w-5xl space-y-6 py-4 sm:py-6">
        <BusinessSetupInquiryDetail
          backHref={backHref}
          submittedAt={formatRelativeTime(setup.createdAt)}
          inquiry={{
            id: setup.id,
            name: setup.name,
            contactName: setup.contactName,
            phone: setup.phone,
            email: setup.email,
            objective: setup.objective,
            businessType: setup.businessType,
            fdiRequested: setup.fdiRequested,
            status: setup.status,
            createdAt: setup.createdAt.toISOString(),
            sectorTags: extras.sectorTags,
            licenseIndustries: extras.licenseIndustries,
            fdiNegativeCodes: extras.fdiNegativeCodes,
            addresses: setup.addresses.map((a) => ({
              kind: a.kind,
              district: a.district,
              localBody: a.localBody,
            })),
            investment: setup.investment
              ? {
                  equityInvestment: Number(setup.investment.equityInvestment),
                  loanInvestment: Number(setup.investment.loanInvestment),
                  fixedAssets: Number(setup.investment.fixedAssets),
                  plantMachineryCost: Number(setup.investment.plantMachineryCost),
                  netCurrentAssets: Number(setup.investment.netCurrentAssets),
                }
              : null,
            shareholders: setup.shareholders.map((sh) => ({
              category: sh.category,
              promoterCount: sh.promoterCount,
              committedCapital: Number(sh.committedCapital),
            })),
            sizeCategory: setup.classification?.sizeCategory ?? null,
            objectiveCategory: setup.classification?.objectiveCategory ?? null,
            licenseRequired: Boolean(setup.classification?.licenseRequired),
            ieeEiaLevel: setup.classification?.ieeEiaLevel ?? null,
          }}
        />
      </div>
    </main>
  );
}
