"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import SmoothButton from "@/components/smoothui/smooth-button";
import { crmHref } from "@/components/advisor/crm-desk";
import { inquiriesHref, parseInquiryType } from "@/components/advisor/inquiries-desk";
import { listingDeskHref } from "@/components/advisor/listings-desk";
import { projectBankHref } from "@/components/advisor/project-bank-desk";
import { setupDeskHref, setupStatusBadge } from "@/components/advisor/business-setup-desk";
import { DashboardEmpty, DashboardPanel, DashboardRow } from "@/components/console/dashboard-panel";
import { SERVICE_INQUIRY_TAB_LABELS, isServiceInquiryType } from "@/lib/service-inquiries";
import { industryLabel } from "@/types/listing";
import { DEAL_DESK_STATUS_LABELS, sectorLabel } from "@/types/project-bank";
import type { DealDeskStatus } from "@/generated/prisma";

type Message = {
  id: string;
  type: string;
  contactName: string;
  subject: string | null;
  status: string;
  createdAt: string;
};

type SaleRequest = {
  listingId: string;
  hashId: string;
  industry: string;
  asking: string;
  sellerName: string;
  submittedAt: string;
};

type ProjectIdea = {
  id: string;
  title: string;
  sector: string;
  createdAt: string;
};

type Setup = {
  id: string;
  name: string;
  contactName: string;
  status: string;
  submittedAt: string;
};

type CrmLead = {
  id: string;
  kind: "buyers" | "investors";
  name: string;
  firm: string | null;
  status: string;
  target: string;
  createdAt: string;
};

function inquiryStatus(status: string) {
  if (status === "NEW") return { label: "New", variant: "warning" as const };
  if (status === "CONTACTED") return { label: "Contacted", variant: "sky" as const };
  return { label: "Closed", variant: "default" as const };
}

function leadStatus(status: string) {
  return DEAL_DESK_STATUS_LABELS[status as DealDeskStatus] ?? status.replace(/_/g, " ");
}

export function DeskHome({
  messages = [],
  newMessageCount,
  setups = [],
  newSetupCount,
  saleRequests = [],
  pendingSaleCount,
  projectIdeas = [],
  pendingIdeaCount,
  crmLeads = [],
  buyerActionCount,
  investorActionCount,
}: {
  messages: Message[];
  newMessageCount: number;
  setups: Setup[];
  newSetupCount: number;
  saleRequests: SaleRequest[];
  pendingSaleCount: number;
  projectIdeas: ProjectIdea[];
  pendingIdeaCount: number;
  crmLeads: CrmLead[];
  buyerActionCount: number;
  investorActionCount: number;
}) {
  return (
    <div className="space-y-4">
      <DashboardPanel
        title="Inquiries"
        description={newMessageCount > 0 ? `${newMessageCount} new` : "Inbox is clear"}
        action={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={inquiriesHref({ status: "NEW" })}>Open inbox</Link>
          </SmoothButton>
        }
      >
        {messages.length === 0 ? (
          <DashboardEmpty>No new inquiries.</DashboardEmpty>
        ) : (
          <div className="divide-y divide-border-subtle">
            {messages.map((m) => {
              const type = parseInquiryType(m.type);
              const badge = inquiryStatus(m.status);
              return (
                <DashboardRow
                  key={m.id}
                  href={inquiriesHref({ type, status: "NEW" })}
                  title={m.contactName}
                  meta={[
                    isServiceInquiryType(m.type) ? SERVICE_INQUIRY_TAB_LABELS[m.type] : m.type,
                    m.subject,
                    m.createdAt,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
                />
              );
            })}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Sale requests"
        description={
          pendingSaleCount > 0
            ? `${pendingSaleCount} waiting for approval`
            : "No businesses waiting for approval"
        }
        action={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={listingDeskHref({})}>Review all</Link>
          </SmoothButton>
        }
      >
        {saleRequests.length === 0 ? (
          <DashboardEmpty>No sale requests pending review.</DashboardEmpty>
        ) : (
          <div className="divide-y divide-border-subtle">
            {saleRequests.map((request) => (
              <DashboardRow
                key={request.listingId}
                href={`/advisor/listings/${request.listingId}/edit`}
                title={request.hashId}
                meta={[industryLabel(request.industry), request.asking, request.sellerName, request.submittedAt]
                  .filter(Boolean)
                  .join(" · ")}
                badge={<Badge variant="warning">New</Badge>}
              />
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Project ideas"
        description={
          pendingIdeaCount > 0
            ? `${pendingIdeaCount} awaiting review`
            : "Nothing waiting for review"
        }
        action={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={projectBankHref({})}>Review all</Link>
          </SmoothButton>
        }
      >
        {projectIdeas.length === 0 ? (
          <DashboardEmpty>No project ideas pending review.</DashboardEmpty>
        ) : (
          <div className="divide-y divide-border-subtle">
            {projectIdeas.map((project) => (
              <DashboardRow
                key={project.id}
                href={`/advisor/project-bank/${project.id}`}
                title={project.title}
                meta={`${sectorLabel(project.sector)} · ${project.createdAt}`}
                badge={<Badge variant="warning">Under review</Badge>}
              />
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Deal-flow CRM"
        description={
          buyerActionCount + investorActionCount > 0
            ? `${buyerActionCount} buyers · ${investorActionCount} investors need action`
            : "No leads needing action"
        }
        action={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={crmHref({})}>Open CRM</Link>
          </SmoothButton>
        }
      >
        {crmLeads.length === 0 ? (
          <DashboardEmpty>No buyer or investor leads needing action.</DashboardEmpty>
        ) : (
          <div className="divide-y divide-border-subtle">
            {crmLeads.map((lead) => (
              <DashboardRow
                key={`${lead.kind}-${lead.id}`}
                href={crmHref({ tab: lead.kind })}
                title={`${lead.name}${lead.firm ? ` · ${lead.firm}` : ""}`}
                meta={`${lead.kind === "buyers" ? "Buyer" : "Investor"} · ${lead.target} · ${lead.createdAt}`}
                badge={<Badge variant="warning">{leadStatus(lead.status)}</Badge>}
              />
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Business setups"
        description={newSetupCount > 0 ? `${newSetupCount} open` : "No open intakes"}
        action={
          <SmoothButton asChild variant="outline" size="sm">
            <Link href={setupDeskHref({})}>Open desk</Link>
          </SmoothButton>
        }
      >
        {setups.length === 0 ? (
          <DashboardEmpty>No open setup requests.</DashboardEmpty>
        ) : (
          <div className="divide-y divide-border-subtle">
            {setups.map((s) => {
              const badge = setupStatusBadge(s.status);
              return (
                <DashboardRow
                  key={s.id}
                  href={`/advisor/business-setups/${s.id}`}
                  title={s.name}
                  meta={`${s.contactName} · ${s.submittedAt}`}
                  badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
                />
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
