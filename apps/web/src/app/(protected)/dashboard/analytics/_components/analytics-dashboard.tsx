"use client";

import { useApi } from "@/hooks/use-api";
import type { AnalyticsMetric, AnalyticsOverview } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Bot, CalendarCheck, Clock3, Database, RefreshCw, Target, Users } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type TimeRange = 7 | 30 | 90;
const funnelOrder = ["created", "qualified", "booked", "won", "lost"] as const;

export default function AnalyticsDashboard() {
  const { api, wsPath, workspaceId } = useApi();
  const [days, setDays] = useState<TimeRange>(30);
  const query = useQuery({
    queryKey: ["analytics", workspaceId, days],
    queryFn: () => api<AnalyticsOverview>(wsPath(`/analytics/overview?days=${days}`)),
    enabled: Boolean(workspaceId),
  });

  if (query.isLoading || !workspaceId) return <AnalyticsSkeleton />;
  if (query.isError || !query.data) {
    return (
      <section className="rounded-xl border border-destructive/30 bg-card p-6" aria-live="polite">
        <h2 className="font-semibold">Analytics could not be loaded</h2>
        <p className="mt-1 text-sm text-muted-foreground">The data is unchanged. Retry the workspace query.</p>
        <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => query.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
        </button>
      </section>
    );
  }

  const data = query.data;
  const created = Math.max(data.funnel.created.value, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Reporting window</p>
          <p className="text-xs text-muted-foreground">
            {data.meta.timezone} · refreshed {new Date(data.meta.generatedAt).toLocaleString()} · {data.meta.freshness}
          </p>
        </div>
        <div className="inline-flex w-fit rounded-lg border bg-muted/40 p-1" aria-label="Analytics reporting period">
          {([7, 30, 90] as TimeRange[]).map((range) => (
            <button key={range} type="button" aria-pressed={days === range} onClick={() => setDays(range)} className={cn("min-h-11 rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", days === range ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{range} days</button>
          ))}
        </div>
      </div>

      <section aria-labelledby="funnel-heading">
        <div className="mb-3 flex items-end justify-between">
          <div><h2 id="funnel-heading" className="text-lg font-semibold">Lead funnel</h2><p className="text-sm text-muted-foreground">Milestones use explicit, inspectable database timestamps and states.</p></div>
          <span className="hidden text-xs text-muted-foreground sm:inline">Denominators appear below each value</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {funnelOrder.map((key) => <FunnelCard key={key} metric={data.funnel[key]} width={(data.funnel[key].value / created) * 100} />)}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <DetailCard icon={<Clock3 className="h-5 w-5" />} title="Response SLA" href={data.responseSla.drillThrough} definition={data.responseSla.definition}>
          <p className="text-3xl font-semibold tabular-nums">{formatPercent(data.responseSla.attainmentPercent)}</p>
          <p className="text-sm text-muted-foreground">within {data.responseSla.targetMinutes} minutes · {data.responseSla.withinTarget}/{data.responseSla.sample} responses</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm"><MetricDatum label="Median" value={formatDuration(data.responseSla.medianMinutes, "min")} /><MetricDatum label="Average" value={formatDuration(data.responseSla.averageMinutes, "min")} /></dl>
        </DetailCard>

        <DetailCard icon={<Target className="h-5 w-5" />} title="Sales velocity" href={data.velocity.drillThrough} definition={data.velocity.definition}>
          <dl className="grid grid-cols-2 gap-4"><MetricDatum label="To qualify" value={formatDuration(data.velocity.averageHoursToQualify, "hr")} detail={`${data.velocity.qualifiedSample} leads`} /><MetricDatum label="To win" value={formatDuration(data.velocity.averageDaysToWin, "days")} detail={`${data.velocity.wonSample} leads`} /></dl>
        </DetailCard>

        <DetailCard icon={<Bot className="h-5 w-5" />} title="Automation reliability" href={data.automation.drillThrough} definition={data.automation.definition}>
          <p className="text-3xl font-semibold tabular-nums">{formatPercent(data.automation.failureRatePercent)}</p><p className="text-sm text-muted-foreground">failure rate · {data.automation.failures}/{data.automation.runs} runs</p>
        </DetailCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5" aria-labelledby="attribution-heading">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" aria-hidden="true" /><h2 id="attribution-heading" className="font-semibold">First-touch attribution</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Share of leads created in this reporting window.</p>
          <div className="mt-5 space-y-4">
            {data.firstTouchAttribution.length ? data.firstTouchAttribution.map((item) => <div key={item.source}><div className="mb-1 flex justify-between text-sm"><span>{sourceLabel(item.source)}</span><span className="tabular-nums">{item.leads} · {item.sharePercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.sharePercent, 100)}%` }} /></div></div>) : <EmptyState label="No leads were created in this window." />}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5" aria-labelledby="health-heading">
          <div className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" aria-hidden="true" /><h2 id="health-heading" className="font-semibold">Integration health</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">{data.integrationHealth.definition}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><MetricDatum label="Google active" value={`${data.integrationHealth.googleBindings.active}/${data.integrationHealth.googleBindings.total}`} /><MetricDatum label="Needs attention" value={String(data.integrationHealth.googleBindings.attention)} warning={data.integrationHealth.googleBindings.attention > 0} /><MetricDatum label="Sheet conflicts" value={String(data.integrationHealth.openSheetConflicts)} warning={data.integrationHealth.openSheetConflicts > 0} /><MetricDatum label="Failed operations" value={String(data.integrationHealth.failedOperations)} warning={data.integrationHealth.failedOperations > 0} /></dl>
          <Link className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={data.integrationHealth.drillThrough}>Inspect integrations <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      </div>

      <aside className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground"><CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><p><span className="font-medium text-foreground">Metric contract:</span> dates are evaluated in {data.meta.timezone}; ratios disclose their denominator; currency is {data.meta.baseCurrency}. Open pipeline ({data.openPipeline.leads}) is a current-state metric and is intentionally independent of the selected window.</p></aside>
    </div>
  );
}

function FunnelCard({ metric, width }: { metric: AnalyticsMetric; width: number }) {
  return <Link href={metric.drillThrough} title={metric.definition} className="group rounded-xl border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-muted-foreground">{metric.label}</p><ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" /></div><p className="mt-2 text-3xl font-semibold tabular-nums">{metric.value.toLocaleString()}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(metric.value ? 4 : 0, Math.min(width, 100))}%` }} /></div><p className="mt-2 min-h-8 text-xs text-muted-foreground">{metric.denominator ? `of ${metric.denominator.value.toLocaleString()} ${metric.denominator.label}` : "All leads created in window"}</p></Link>;
}

function DetailCard({ icon, title, href, definition, children }: { icon: ReactNode; title: string; href: string; definition: string; children: ReactNode }) {
  return <section className="rounded-xl border bg-card p-5"><div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-semibold text-foreground">{title}</h2></div><div className="mt-5">{children}</div><p className="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">{definition}</p><Link className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={href}>View records <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></section>;
}

function MetricDatum({ label, value, detail, warning }: { label: string; value: string; detail?: string; warning?: boolean }) {
  return <div className="rounded-lg border bg-background p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground">{warning && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />}{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>{detail && <p className="text-xs text-muted-foreground">{detail}</p>}</div>;
}

function EmptyState({ label }: { label: string }) { return <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{label}</p>; }
function formatPercent(value: number | null) { return value === null ? "—" : `${value}%`; }
function formatDuration(value: number | null, unit: string) { return value === null ? "—" : `${value} ${unit}`; }
function sourceLabel(source: string) { return source.toLowerCase().replaceAll("_", " ").replace(/^./, (value) => value.toUpperCase()); }

function AnalyticsSkeleton() {
  return <div className="space-y-4" aria-label="Loading analytics" aria-busy="true"><div className="h-20 rounded-xl bg-muted"/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 rounded-xl bg-muted" />)}</div><div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-64 rounded-xl bg-muted" />)}</div></div>;
}
