"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { BarChart2Icon, TrendingUp } from "@/lib/icons/app-icons"

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import {
  getAgentAnalytics,
  type AgentAnalytics,
} from "@/lib/actions/sessions";
import { Card, CardContent } from "@/components/ui/card";

type Props = { agentId: string };

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-hairline bg-surface-card px-4 py-3",
        className,
      )}
    >
      <span className="text-[11px] font-medium text-muted-soft uppercase tracking-wider">
        {label}
      </span>
      <span className="font-display text-display-sm tracking-tight text-ink">
        {value}
      </span>
    </div>
  );
}

export function AgentDetailAnalyticsTab({ agentId }: Props) {
  const [data, setData] = React.useState<AgentAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    getAgentAnalytics(agentId).then((res) => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-body-sm text-muted">Loading analytics…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AppIcon icon={BarChart2Icon} className="mb-3 h-8 w-8 text-muted-soft" strokeWidth={1.25} />
        <p className="text-body-sm text-muted">Could not load analytics</p>
      </div>
    );
  }

  const hasData = data.totalSessions > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AppIcon icon={BarChart2Icon} className="mb-3 h-8 w-8 text-muted-soft" strokeWidth={1.25} />
        <p className="text-body-sm text-muted">No sessions handled yet</p>
      </div>
    );
  }

  const series = data.dailySeries.map((d) => ({
    date: d.date,
    value: d.count,
  }));

  const resolutionSeries = data.dailySeries.map((d) => ({
    date: d.date,
    value: d.count > 0 ? (d.resolvedCount / d.count) * 100 : 0,
  }));

  const hasChannelData = data.sessionsByChannel.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Sessions Handled" value={data.totalSessions} />
        <MetricCard
          label="Resolution Rate"
          value={`${data.aiResolutionRate.toFixed(1)}%`}
        />
        <MetricCard
          label="Avg Sentiment"
          value={
            data.averageSentiment != null
              ? data.averageSentiment.toFixed(2)
              : "—"
          }
        />
        <MetricCard
          label="Avg Duration"
          value={formatDuration(data.averageDuration)}
        />
        <MetricCard
          label="Avg QA Score"
          value={
            data.averageQaScore != null
              ? `${data.averageQaScore.toFixed(1)}`
              : "—"
          }
        />
        <MetricCard
          label="Total Cost"
          value={`$${data.totalCost.toFixed(2)}`}
        />
      </div>

      {/* Daily session volume chart */}
      <Card className="overflow-hidden rounded-xl border-hairline bg-surface-card">
        <CardContent className="p-4">
          <span className="text-body-sm font-medium text-ink">
            Sessions (Last 14 Days)
          </span>
          <div className="mt-2 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="agentChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A36" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#FF5A36" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#e7e5e4"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(`${v}T00:00:00Z`);
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  tick={{ fontSize: 10, fill: "#a8a29e" }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#a8a29e" }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={32}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FF5A36"
                  strokeWidth={2}
                  fill="url(#agentChartGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resolution rate mini chart */}
      {resolutionSeries.some((d) => d.value > 0) && (
        <Card className="overflow-hidden rounded-xl border-hairline bg-surface-card">
          <CardContent className="p-4">
            <span className="text-body-sm font-medium text-ink">
              Resolution Rate (Last 14 Days)
            </span>
            <div className="mt-2 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={resolutionSeries}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="agentResGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="#e7e5e4"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => {
                      const d = new Date(`${v}T00:00:00Z`);
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                    tick={{ fontSize: 10, fill: "#a8a29e" }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a8a29e" }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    width={32}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fill="url(#agentResGrad)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel breakdown */}
      {hasChannelData && (
        <Card className="overflow-hidden rounded-xl border-hairline bg-surface-card">
          <CardContent className="p-4">
            <span className="text-body-sm font-medium text-ink">
              Sessions by Channel
            </span>
            <div className="mt-3 flex flex-col gap-1.5">
              {data.sessionsByChannel.map((entry) => {
                const pct = (entry.count / data.totalSessions) * 100;
                return (
                  <div key={entry.channel} className="flex items-center gap-3">
                    <span className="w-24 text-body-sm text-muted">
                      {entry.channel}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-strong">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-body-sm tabular-nums text-ink">
                        {entry.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
