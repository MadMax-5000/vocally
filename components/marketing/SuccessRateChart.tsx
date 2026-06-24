"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatShortDate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function generateSeries() {
  const points: { date: string; aiResolution: number; csat: number }[] = [];
  // 30 days of data for richer curves
  const start = new Date(Date.UTC(2026, 3, 2)); // Apr 2, 2026

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);

    // Smooth-but-interesting curves (sinusoid + subtle drift)
    const t = i / 29;
    const ai =
      74.5 +
      4.2 * Math.sin(i * 0.55) +
      2.1 * Math.sin(i * 0.18 + 0.9) +
      1.6 * (t - 0.5);
    const cs =
      62.0 +
      3.0 * Math.sin(i * 0.48 + 0.5) +
      1.2 * Math.sin(i * 0.15 + 1.4) +
      1.0 * (t - 0.5);

    points.push({
      date: iso,
      aiResolution: clamp(ai, 58, 92),
      csat: clamp(cs, 45, 88),
    });
  }

  return points;
}

const data = generateSeries();

type TooltipPayloadEntry = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const labelMap: Record<string, string> = {
    aiResolution: "AI Resolution",
    csat: "CSAT",
  };

  return (
    <div className="min-w-[9rem] rounded-lg border border-hairline bg-surface-card px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <p className="mb-1.5 text-[11px] font-semibold tracking-wide uppercase text-muted">
        {label}
      </p>
      <div className="grid gap-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[12px] text-muted">
                {labelMap[entry.name] ?? entry.name}
              </span>
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-ink">
              {entry.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuccessRateChart() {
  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.96px] uppercase text-muted">
              Success rate
            </p>
            <p className="mt-1 font-display text-[28px] font-normal leading-none tracking-tight text-ink">
               78.3%
            </p>
          </div>
          {/* Dotted legend — top-right */}
          <div className="flex flex-col items-end gap-1 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] text-muted">              82.40%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-ink" />
              <span className="text-[11px] text-muted">67.32%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inner framed chart */}
      <div className="px-6 pt-6 pb-4">
        <div className="rounded-lg border border-hairline-soft bg-canvas-soft p-3">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#e7e5e4"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => formatShortDate(v)}
                  interval="preserveStartEnd"
                  minTickGap={18}
                  tick={{ fontSize: 10, fill: "#777169" }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 10, fill: "#777169" }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#d6d3d1", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Line
                  type="monotone"
                  dataKey="aiResolution"
                  stroke="#FF5A36"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#FF5A36", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="csat"
                  stroke="#0c0a09"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#0c0a09", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
