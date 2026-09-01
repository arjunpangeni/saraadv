"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileText,
  Landmark,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNpr } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { FinancialStatementTables } from "@/components/wizard/financial-year-matrix";
import type { MatrixYearRow } from "@/lib/financial-matrix";
import {
  COMPLIANCE_AUTHORITY_LABELS,
  REVALUATION_ASSET_LABELS,
} from "@/types/listing";

export interface ListingDataRoomProps {
  listingId: string;
  historical: MatrixYearRow[];
  forecast: MatrixYearRow[];
  strategicAssumptions: string | null;
  forecastExtras: { label: string; growthPct: number; marginPct: number; capex: number }[];
  assetRevaluations: {
    assetType: string;
    bookValue: number;
    marketValue: number;
    notes: string | null;
  }[];
  complianceRecords: {
    authority: string;
    status: string;
    identifier: string | null;
    lastClearanceYear: number | null;
    remarks: string | null;
    outstandingDisputes?: string | null;
  }[];
  ipAssets: { type: string; reference: string }[];
  humanCapital: {
    managementCount: number;
    technicalCount: number;
    generalCount: number;
    ssfCompliant: boolean;
  } | null;
  riskLog: {
    outstandingDebt: number;
    assetEncumbrances: string | null;
    bankCollateralTies: string | null;
    pendingLitigations: string | null;
  } | null;
  capacityPct: number | null;
  plantLocation?: string | null;
}

const SECTIONS = [
  { id: "financials", label: "Financials", icon: BarChart3 },
  { id: "projections", label: "Projections", icon: TrendingUp },
  { id: "assets", label: "Revaluation", icon: Landmark },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "risk", label: "Risk", icon: AlertTriangle },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

function SectionHeading({
  id,
  icon: Icon,
  title,
  subtitle,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div id={id} className="mb-5 flex scroll-mt-24 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky-muted text-brand-sky">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function ListingDataRoom(props: ListingDataRoomProps) {
  const [docs, setDocs] = useState<{ id: string; type: string; url: string }[] | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("financials");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDocs(true);
      const res = await fetch(`/api/listings/${props.listingId}/documents`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setDocs(data.documents);
      }
      if (!cancelled) setLoadingDocs(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [props.listingId]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(s.id);
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="space-y-6">
      <nav aria-label="Data room sections" className="sticky top-[4.75rem] z-20 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm">
        <ul className="flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSection === s.id
                    ? "bg-primary text-white"
                    : "border border-border-subtle bg-surface-elevated text-muted-foreground hover:border-brand-sky/40 hover:text-brand-sky"
                )}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="card-elevated p-6 sm:p-8">
        <SectionHeading
          id="financials"
          icon={BarChart3}
          title="Historical financials"
          subtitle="Line-item balance sheet, P&L, and cash flows across three fiscal years."
        />
        {props.historical.length > 0 ? (
          <FinancialStatementTables years={props.historical} />
        ) : (
          <p className="text-sm text-muted-foreground">No historical financials on file.</p>
        )}
      </section>

      <section className="card-elevated p-6 sm:p-8">
        <SectionHeading
          id="projections"
          icon={TrendingUp}
          title="Projections"
          subtitle="Forward-looking statements, growth, margins, and capital expenditure."
        />
        <div className="space-y-6">
          {props.forecastExtras.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background/90 text-muted-foreground">
                    <th className="px-4 py-2 text-left text-xs tracking-wide uppercase">Year</th>
                    <th className="px-4 py-2 text-right text-xs tracking-wide uppercase">Revenue growth %</th>
                    <th className="px-4 py-2 text-right text-xs tracking-wide uppercase">Net margin %</th>
                    <th className="px-4 py-2 text-right text-xs tracking-wide uppercase">CAPEX</th>
                  </tr>
                </thead>
                <tbody>
                  {props.forecastExtras.map((p) => (
                    <tr key={p.label} className="border-t border-border-subtle">
                      <td className="px-4 py-2">{p.label}</td>
                      <td className="px-4 py-2 text-right">{p.growthPct}%</td>
                      <td className="px-4 py-2 text-right">{p.marginPct}%</td>
                      <td className="px-4 py-2 text-right">{formatNpr(p.capex)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {props.strategicAssumptions ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Strategic assumptions</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{props.strategicAssumptions}</p>
            </div>
          ) : null}
          {props.forecast.length > 0 ? (
            <FinancialStatementTables years={props.forecast} />
          ) : (
            <p className="text-sm text-muted-foreground">No projected statements on file.</p>
          )}
        </div>
      </section>

      <section className="card-elevated p-6 sm:p-8">
        <SectionHeading
          id="assets"
          icon={Landmark}
          title="Asset revaluation"
          subtitle="Book value versus realisable value and net adjustments."
        />
        {props.assetRevaluations.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background/90 text-muted-foreground">
                  <th className="px-4 py-2 text-left text-xs tracking-wide uppercase">Particulars</th>
                  <th className="px-4 py-2 text-right text-xs tracking-wide uppercase">Book Value</th>
                  <th className="px-4 py-2 text-right text-xs tracking-wide uppercase">Realisable Value</th>
                  <th className="px-4 py-2 text-right text-xs tracking-wide uppercase">Net Adjustments</th>
                </tr>
              </thead>
              <tbody>
                {props.assetRevaluations.map((a) => (
                  <tr key={a.assetType} className="border-t border-border-subtle">
                    <td className="px-4 py-2">
                      {REVALUATION_ASSET_LABELS[a.assetType as keyof typeof REVALUATION_ASSET_LABELS] ??
                        a.assetType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2 text-right">{formatNpr(a.bookValue)}</td>
                    <td className="px-4 py-2 text-right">{formatNpr(a.marketValue)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatNpr(a.marketValue - a.bookValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No asset revaluations on file.</p>
        )}
      </section>

      <section className="card-elevated p-6 sm:p-8">
        <SectionHeading
          id="compliance"
          icon={Shield}
          title="Compliance & operations"
          subtitle="Regulatory status, IP, and human capital."
        />
        <div className="space-y-6">
          {props.plantLocation ? (
            <p className="text-sm text-foreground/80">
              <span className="font-medium text-foreground">Plant / factory: </span>
              {props.plantLocation}
            </p>
          ) : null}
          {props.complianceRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background/90 text-muted-foreground">
                    <th className="px-4 py-2 text-left text-xs tracking-wide uppercase">Particulars</th>
                    <th className="px-4 py-2 text-left text-xs tracking-wide uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs tracking-wide uppercase">Complied upto</th>
                    <th className="px-4 py-2 text-left text-xs tracking-wide uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {props.complianceRecords.map((c, i) => (
                    <tr key={i} className="border-t border-border-subtle">
                      <td className="px-4 py-2">
                        {COMPLIANCE_AUTHORITY_LABELS[c.authority as keyof typeof COMPLIANCE_AUTHORITY_LABELS] ??
                          c.authority.replace(/_/g, " ")}
                        {c.identifier ? ` (${c.identifier})` : ""}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={c.status === "COMPLIANT" ? "success" : "warning"}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-2">{c.lastClearanceYear ?? "—"}</td>
                      <td className="px-4 py-2">
                        {c.remarks || c.outstandingDisputes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No compliance records filed.</p>
          )}

          {props.ipAssets.length > 0 ? (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-brand-sky" />
                Intellectual property
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {props.ipAssets.map((ip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-medium text-foreground">{ip.type}:</span>
                    <span>{ip.reference}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {props.humanCapital ? (
            <div className="rounded-xl border border-border-subtle bg-background p-5 text-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-brand-sky" />
                Human capital
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Management</p>
                  <p className="mt-0.5 text-xl font-bold text-foreground">{props.humanCapital.managementCount}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">Technical</p>
                  <p className="mt-0.5 text-xl font-bold text-foreground">{props.humanCapital.technicalCount}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">General</p>
                  <p className="mt-0.5 text-xl font-bold text-foreground">{props.humanCapital.generalCount}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-muted-foreground">
                <p>SSF compliant: {props.humanCapital.ssfCompliant ? "Yes" : "No"}</p>
                {props.capacityPct !== null ? <p>Plant utilization: {props.capacityPct}%</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card-elevated p-6 sm:p-8">
        <SectionHeading
          id="risk"
          icon={AlertTriangle}
          title="Risk log"
          subtitle="Debt, encumbrances, collateral, and litigation."
        />
        {props.riskLog ? (
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-border-subtle bg-background p-5 sm:col-span-2">
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">Outstanding debt</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground">{formatNpr(props.riskLog.outstandingDebt)}</dd>
            </div>
            {props.riskLog.assetEncumbrances ? (
              <div>
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">Asset encumbrances</dt>
                <dd className="mt-1.5 leading-relaxed text-foreground">{props.riskLog.assetEncumbrances}</dd>
              </div>
            ) : null}
            {props.riskLog.bankCollateralTies ? (
              <div>
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">Bank collateral ties</dt>
                <dd className="mt-1.5 leading-relaxed text-foreground">{props.riskLog.bankCollateralTies}</dd>
              </div>
            ) : null}
            {props.riskLog.pendingLitigations ? (
              <div className="sm:col-span-2">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">Pending litigations</dt>
                <dd className="mt-1.5 leading-relaxed text-foreground">{props.riskLog.pendingLitigations}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No risk log on file.</p>
        )}
      </section>

      <section className="card-elevated p-6 sm:p-8">
        <SectionHeading
          id="documents"
          icon={FileText}
          title="Documents"
          subtitle="Regulatory attachments and supporting files."
        />
        {loadingDocs ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : docs && docs.length > 0 ? (
          <ul className="space-y-3">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle p-4 transition-colors hover:border-brand-sky/30"
              >
                <p className="font-medium text-foreground">{d.type.replace(/_/g, " ")}</p>
                <a href={d.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No regulatory attachments uploaded for this listing.</p>
        )}
      </section>
    </div>
  );
}
