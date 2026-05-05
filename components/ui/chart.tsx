"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { LegendProps } from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, cfg]) => cfg.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, cfg]) =>
            cfg.color ? `  --color-${key}: ${cfg.color};` : null
          )
          .filter(Boolean)
          .join("\n")}\n}`,
      }}
    />
  );
};

export const ChartTooltip = RechartsPrimitive.Tooltip;

type PayloadEntry = {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
};

export type ChartTooltipContentProps = {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
};

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-hairline bg-surface-card px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] text-[13px]",
          className
        )}
      >
        {!hideLabel && label && (
          <div className="font-semibold text-ink">{label}</div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = String(nameKey ?? item.name ?? item.dataKey ?? "value");
            const itemConfig = config[key];
            const indicatorColor = item.color ?? item.fill;

            return (
              <div
                key={`${String(item.dataKey)}-${index}`}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2",
                  indicator === "dot" && "items-center"
                )}
              >
                {!hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0",
                      indicator === "dot" && "h-2.5 w-2.5 rounded-full",
                      indicator === "line" && "w-1 rounded-[2px]",
                      indicator === "dashed" &&
                        "w-0 border-[1.5px] border-dashed bg-transparent"
                    )}
                    style={{ backgroundColor: indicatorColor }}
                  />
                )}
                <div className="flex flex-1 justify-between gap-1 leading-none">
                  <span className="text-muted">
                    {itemConfig?.label ?? String(item.name ?? "")}
                  </span>
                  {item.value != null && (
                    <span className="font-semibold tabular-nums text-ink">
                      {typeof item.value === "number"
                        ? `${item.value.toFixed(2)}%`
                        : String(item.value)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = RechartsPrimitive.Legend;

type LegendPayloadItem = {
  value?: string;
  dataKey?: string | number;
  color?: string;
};

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: LegendPayloadItem[];
    verticalAlign?: LegendProps["verticalAlign"];
    hideIcon?: boolean;
    nameKey?: string;
  }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom" }, ref) => {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item) => {
        const key = String(item.dataKey ?? "value");
        const itemConfig = config[key];

        return (
          <div key={String(item.value)} className="flex items-center gap-1.5">
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";
