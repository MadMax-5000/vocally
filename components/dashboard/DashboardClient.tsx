"use client";
import { AppIcon } from "@/components/ui/app-icon";
import {
  BarChart2Icon,
  DownloadIcon,
  ExternalLink,
  TrendingUp,
} from "@/lib/icons/app-icons";
import { useLocale, useTranslations } from "next-intl";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardStats } from "@/lib/actions/sessions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Chart config ─────────────────────────────────────────────────────────────

const CHART_COLOR = "#FF5A36";

const chartConfig = {
  count: { color: CHART_COLOR },
  avgDuration: { color: CHART_COLOR },
  totalCost: { color: CHART_COLOR },
  avgCost: { color: CHART_COLOR },
  totalLlmCost: { color: CHART_COLOR },
  avgLlmCost: { color: CHART_COLOR },
} satisfies ChartConfig;

type ChartKey = keyof typeof chartConfig;

const chartTabs: ChartKey[] = [
  "count",
  "avgDuration",
  "totalCost",
  "avgCost",
  "totalLlmCost",
  "avgLlmCost",
];

const CHANNEL_COLORS: Record<string, string> = {
  VOICE: "#2563eb",
  CHAT: "#16a34a",
  SMS: "#f59e0b",
  WHATSAPP: "#0891b2",
  EMAIL: "#8b5cf6",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(isoDate: string, locale: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null, locale: string): string {
  if (seconds == null) return "—";
  if (seconds < 1)
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "millisecond",
      unitDisplay: "narrow",
    }).format(Math.round(seconds * 1000));
  if (seconds < 60)
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "second",
      unitDisplay: "narrow",
      maximumFractionDigits: 2,
    }).format(seconds);
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "minute",
    unitDisplay: "narrow",
  }).format(mins)} ${new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "second",
    unitDisplay: "narrow",
  }).format(secs)}`;
}

function formatDurationCompact(seconds: number, locale: string): string {
  if (seconds < 0) return formatDuration(0, locale);
  if (seconds < 60) return formatDuration(Math.round(seconds), locale);
  const mins = Math.round(seconds / 60);
  if (mins < 60)
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "minute",
      unitDisplay: "narrow",
    }).format(mins);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  const formatter = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "hour",
    unitDisplay: "narrow",
  });
  return remMins > 0
    ? `${formatter.format(hours)} ${new Intl.NumberFormat(locale, {
        style: "unit",
        unit: "minute",
        unitDisplay: "narrow",
      }).format(remMins)}`
    : formatter.format(hours);
}

// ─── Stable grad id ───────────────────────────────────────────────────────────

let _gc = 0;
function useGradId() {
  const ref = React.useRef<string | null>(null);
  if (!ref.current) ref.current = `g${++_gc}`;
  return ref.current;
}

// ─── Detail area chart ────────────────────────────────────────────────────────

function DetailArea({
  data,
  color,
  yTickFormatter,
  tooltipValueFormatter,
}: {
  data: { date: string; value: number }[];
  color: string;
  yTickFormatter?: (v: number) => string;
  tooltipValueFormatter?: (v: number) => string;
}) {
  const id = useGradId();
  const locale = useLocale();
  const config = { value: { label: "", color } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-full w-full min-w-0">
      <AreaChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.16} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
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
            return d.toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }}
          interval="preserveStartEnd"
          minTickGap={60}
          tick={{ fontSize: 10, fill: "#a8a29e" }}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#a8a29e" }}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={48}
          tickFormatter={yTickFormatter}
          domain={[0, "auto"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              className="rounded-xl border-hairline bg-surface-card shadow-md"
              valueFormatter={tooltipValueFormatter}
            />
          }
          cursor={{
            stroke: "#d6d3d1",
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Stat card (bottom row) ───────────────────────────────────────────────────

function StatCard({
  title,
  value,
  series,
  color,
  yTickFormatter,
  tooltipValueFormatter,
  showFilter,
  noData,
  showLinearScale,
  infoIcon,
  chartHeight = 160,
}: {
  title: string;
  value: React.ReactNode;
  series: { date: string; value: number }[];
  color: string;
  yTickFormatter?: (v: number) => string;
  tooltipValueFormatter?: (v: number) => string;
  showFilter?: boolean;
  noData?: boolean;
  showLinearScale?: boolean;
  infoIcon?: boolean;
  chartHeight?: number;
}) {
  const t = useTranslations("dashboard.home");
  return (
    <Card className="overflow-hidden rounded-xl border-hairline bg-surface-card">
      <CardContent className="p-0">
        <div className="flex items-start justify-between px-4 pt-4 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-body-sm font-medium text-ink">{title}</span>
            {infoIcon && (
              <span
                title={t("moreInfo")}
                className="flex h-4 w-4 cursor-default select-none items-center justify-center rounded-full border border-hairline text-[10px] font-semibold text-muted"
              >
                i
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showLinearScale && (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-hairline bg-surface-card px-2 py-1 text-caption font-medium text-body shadow-none transition-colors hover:bg-canvas-soft"
              >
                <AppIcon
                  icon={TrendingUp}
                  className="h-3 w-3 text-muted"
                  aria-hidden
                />
                {t("linearScale")}
              </button>
            )}
            <button
              type="button"
              aria-label={t("download")}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-surface-card text-muted shadow-none transition-colors hover:bg-canvas-soft hover:text-ink"
            >
              <AppIcon
                icon={DownloadIcon}
                className="h-3.5 w-3.5"
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <span className="font-display text-display-sm tracking-tight text-ink">
            {value}
          </span>
        </div>

        {noData ? (
          <div className="flex flex-col items-center justify-center py-10">
            <AppIcon
              icon={BarChart2Icon}
              className="h-12 w-12 text-muted-soft"
              aria-hidden
              strokeWidth={1.25}
            />
            <p className="mt-3 text-body-sm text-muted">
              {t("noDataCollected")}
            </p>
          </div>
        ) : (
          <div style={{ height: chartHeight }} className="px-2 min-w-0">
            <DetailArea
              data={series}
              color={color}
              yTickFormatter={yTickFormatter}
              tooltipValueFormatter={tooltipValueFormatter}
            />
          </div>
        )}

        {!noData && (
          <div className="flex items-center justify-between border-t border-hairline px-4 py-2">
            <div className="flex items-center gap-2">
              {showFilter && (
                <>
                  <span className="text-caption text-muted">{t("filter")}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 rounded-md border-hairline bg-surface-card px-2 text-caption font-medium text-body shadow-none hover:bg-canvas-soft"
                      >
                        {t("all")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-[8rem] rounded-xl border-hairline bg-surface-card"
                    >
                      <DropdownMenuItem>{t("all")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-md border-hairline bg-surface-card px-2.5 text-caption font-medium text-body shadow-none hover:bg-canvas-soft"
            >
              {t("filteredCallHistory")}
              <AppIcon
                icon={ExternalLink}
                className="h-3 w-3 text-muted"
                aria-hidden
              />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  const t = useTranslations("dashboard.home");
  const locale = useLocale();
  const [activeChart, setActiveChart] = React.useState<ChartKey>("count");
  const mainGradId = `fill-main-${activeChart}`;
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greetings.morning");
    if (hour < 17) return t("greetings.afternoon");
    return t("greetings.evening");
  })();
  const formatTabValue = (key: ChartKey, value: number): string => {
    if (key === "avgDuration") return formatDuration(value, locale);
    if (key === "totalLlmCost" || key === "avgLlmCost")
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
      }).format(value);
    if (key === "totalCost" || key === "avgCost")
      return t("credits", { count: value.toFixed(2) });
    return String(value);
  };
  const yAxisTickFormatter = (key: ChartKey, value: number): string => {
    if (key === "avgDuration") return formatDurationCompact(value, locale);
    if (key === "totalLlmCost" || key === "avgLlmCost")
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    return String(value);
  };

  const tabValues = React.useMemo(() => {
    const totalCalls = stats.dailySeries.reduce((s, d) => s + d.count, 0);
    const totalCost = stats.dailySeries.reduce((s, d) => s + d.totalCost, 0);
    const totalLlmCost = stats.dailySeries.reduce(
      (s, d) => s + d.totalLlmCost,
      0,
    );
    const costEntries = stats.dailySeries.filter((d) => d.avgCost > 0);
    const llmCostEntries = stats.dailySeries.filter((d) => d.avgLlmCost > 0);
    return {
      count: totalCalls,
      avgDuration: stats.averageDuration ?? 0,
      totalCost: parseFloat(totalCost.toFixed(2)),
      avgCost:
        costEntries.length > 0
          ? parseFloat((totalCost / costEntries.length).toFixed(2))
          : 0,
      totalLlmCost: parseFloat(totalLlmCost.toFixed(2)),
      avgLlmCost:
        llmCostEntries.length > 0
          ? parseFloat((totalLlmCost / llmCostEntries.length).toFixed(2))
          : 0,
    };
  }, [stats]);

  const last14 = stats.dailySeries.slice(-14);

  const resolutionSeries = React.useMemo(
    () =>
      last14.map((d) => ({
        date: d.date,
        value: d.count > 0 ? (d.resolvedCount / d.count) * 100 : 0,
      })),
    [last14],
  );
  const qaScoreSeries = React.useMemo(
    () => last14.map((d) => ({ date: d.date, value: d.avgQaScore ?? 0 })),
    [last14],
  );
  const responseTimeSeries = React.useMemo(
    () => last14.map((d) => ({ date: d.date, value: d.avgResponseTime ?? 0 })),
    [last14],
  );
  const totalDurationSeries = React.useMemo(
    () => last14.map((d) => ({ date: d.date, value: d.totalDuration ?? 0 })),
    [last14],
  );

  const hasQaData = qaScoreSeries.some((d) => d.value > 0);

  const channelPieData = React.useMemo(
    () =>
      stats.sessionsByChannel.map((entry) => ({
        channel: entry.channel,
        sessions: entry.count,
        fill: CHANNEL_COLORS[entry.channel] ?? "#a8a29e",
      })),
    [stats.sessionsByChannel],
  );

  const totalPieSessions = React.useMemo(
    () => channelPieData.reduce((acc, curr) => acc + curr.sessions, 0),
    [channelPieData],
  );

  const channelChartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      sessions: { label: t("sessions") },
    };
    for (const entry of channelPieData) {
      cfg[entry.channel] = {
        label: t(`channels.${entry.channel.toLowerCase()}`),
        color: entry.fill,
      };
    }
    return cfg;
  }, [channelPieData, t]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 flex flex-col gap-3">
      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-sm font-normal tracking-tight text-ink">
          {greeting}
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-card px-3 py-[3px] text-body-sm font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          {t("activeCalls")}{" "}
          <span className="font-semibold">{stats.activeSessions}</span>
        </span>
      </div>

      {/* ── Main chart card ───────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-xl border-hairline bg-surface-card">
        <CardHeader className="p-0">
          <div className="flex flex-wrap border-b border-hairline">
            {chartTabs.map((tab) => {
              const isActive = activeChart === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveChart(tab)}
                  className={[
                    "relative flex flex-1 flex-col gap-0.5 px-4 py-3 text-left transition-colors",
                    "border-r border-hairline last:border-r-0",
                    isActive
                      ? "bg-surface-card"
                      : "bg-canvas-soft hover:bg-surface-card",
                  ].join(" ")}
                >
                  <span className="text-caption text-muted">
                    {t(`chartTabs.${tab}`)}
                  </span>
                  <span
                    className={[
                      "mt-0.5 font-display text-display-sm tracking-tight",
                      isActive ? "text-ink" : "text-body",
                    ].join(" ")}
                  >
                    {formatTabValue(tab, tabValues[tab])}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
                  )}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="px-3 pt-3 pb-0">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full min-w-0"
          >
            <AreaChart
              data={stats.dailySeries}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={mainGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLOR}
                    stopOpacity={0.18}
                  />
                  <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#e7e5e4"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => formatShortDate(v, locale)}
                interval="preserveStartEnd"
                minTickGap={60}
                tick={{ fontSize: 10, fill: "#a8a29e" }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#a8a29e" }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={44}
                allowDecimals={false}
                domain={[0, "auto"]}
                tickFormatter={(v: number) =>
                  yAxisTickFormatter(activeChart, v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    className="rounded-xl border-hairline bg-surface-card shadow-md"
                    valueFormatter={(v: number) =>
                      formatTabValue(activeChart, v)
                    }
                  />
                }
                cursor={{
                  stroke: "#d6d3d1",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey={activeChart}
                connectNulls
                stroke={CHART_COLOR}
                strokeWidth={2}
                fill={`url(#${mainGradId})`}
                dot={false}
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  fill: CHART_COLOR,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>

        <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-hairline bg-surface-card px-2.5 py-1 text-caption font-medium text-body shadow-none transition-colors hover:bg-canvas-soft"
          >
            <AppIcon
              icon={TrendingUp}
              className="h-3 w-3 text-muted"
              aria-hidden
            />
            {t("linearScale")}
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={t("download")}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-surface-card text-muted shadow-none transition-colors hover:bg-canvas-soft hover:text-ink"
            >
              <AppIcon
                icon={DownloadIcon}
                className="h-3.5 w-3.5"
                aria-hidden
              />
            </button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-md border-hairline bg-surface-card px-2.5 text-caption font-medium text-body shadow-none hover:bg-canvas-soft"
            >
              {t("filteredCallHistory")}
              <AppIcon
                icon={ExternalLink}
                className="h-3 w-3 text-muted"
                aria-hidden
              />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Row 1: Success Rate + CSAT ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          title={t("overallSuccessRate")}
          value={`${stats.aiResolutionRate.toFixed(1)}%`}
          series={resolutionSeries}
          color="#16a34a"
          yTickFormatter={(v) => `${v.toFixed(0)}%`}
          showFilter
          chartHeight={170}
        />
        <StatCard
          title={t("averageCsatRating")}
          value={hasQaData ? (stats.averageQaScore?.toFixed(1) ?? "—") : "---"}
          series={qaScoreSeries}
          color="#3b82f6"
          noData={!hasQaData}
          chartHeight={170}
          tooltipValueFormatter={(v: number) => v.toFixed(2)}
        />
      </div>

      {/* ── Row 2: Response Time + Total Duration ─────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          title={t("agentResponseTime")}
          value={
            stats.averageResponseTime != null
              ? formatDuration(stats.averageResponseTime, locale)
              : "—"
          }
          series={responseTimeSeries}
          color="#b91c1c"
          yTickFormatter={(v) => formatDurationCompact(v, locale)}
          tooltipValueFormatter={(v: number) => formatDuration(v, locale)}
          showLinearScale
          infoIcon
          chartHeight={170}
        />
        <StatCard
          title={t("totalConversationDuration")}
          value={
            stats.totalDuration != null
              ? formatDuration(stats.totalDuration, locale)
              : "—"
          }
          series={totalDurationSeries}
          color="#7c3aed"
          yTickFormatter={(v) => formatDurationCompact(v, locale)}
          tooltipValueFormatter={(v: number) => formatDuration(v, locale)}
          showLinearScale
          infoIcon
          chartHeight={170}
        />
      </div>

      {/* ── Row 3: Sessions by Channel (PieChart) ─────────────────────── */}
      <Card className="overflow-hidden rounded-xl border-hairline bg-surface-card">
        <CardHeader className="px-4 pt-4 pb-0">
          <span className="text-body-sm font-medium text-ink">
            {t("sessionsByChannel")}
          </span>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {channelPieData.length > 0 ? (
            <ChartContainer
              config={channelChartConfig}
              className="mx-auto aspect-square max-h-[250px] w-full min-w-0"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={channelPieData}
                  dataKey="sessions"
                  nameKey="channel"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalPieSessions.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {t("sessions")}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <AppIcon
                icon={BarChart2Icon}
                className="h-12 w-12 text-muted-soft"
                aria-hidden
                strokeWidth={1.25}
              />
              <p className="mt-3 text-body-sm text-muted">
                {t("noChannelData")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
