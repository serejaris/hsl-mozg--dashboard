"use client";

import * as React from "react";
import {
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from "recharts";
import type { TooltipProps } from "recharts";

type ChartConfigEntry = {
  label?: string;
  color?: string;
};

export type ChartConfig = Record<string, ChartConfigEntry>;

type ExtendedTooltipProps = TooltipProps<string | number, string | number> & {
  label?: React.ReactNode;
  payload?: any[];
};

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config?: ChartConfig;
};

const ChartContext = React.createContext<ChartConfig | undefined>(undefined);

export function ChartContainer({
  className,
  children,
  config,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={config}>
      <div className={className} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export function useChartConfig() {
  return React.useContext(ChartContext);
}

export function ChartTooltip(
  props: Omit<React.ComponentProps<typeof RechartsTooltip>, "content"> & {
    content?: React.ReactNode;
  }
) {
  const { content, ...rest } = props;
  return <RechartsTooltip {...rest} content={content as any} />;
}

export function ChartTooltipContent({
  labelKey,
  nameKey,
}: {
  labelKey?: string;
  nameKey?: string;
}) {
  const config = useChartConfig();
  return function RenderTooltipContent({ label, payload }: ExtendedTooltipProps) {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-sm">
        {label && (
          <div className="mb-1 text-xs font-medium opacity-70">
            {typeof label === "string" && labelKey ? labelKey : label}
          </div>
        )}
        <div className="space-y-1">
          {payload.map((item, idx) => {
            const key = (item.dataKey as string) ?? String(idx);
            const cfg = config?.[key];
            const name = (cfg?.label ?? item.name ?? key) as React.ReactNode;
            const color = (cfg?.color ?? (item.color as string)) as string;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="grow truncate">{nameKey ? nameKey : name}</span>
                <span className="tabular-nums">{item.value as any}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } as any;
}

export function ChartLegend(
  props: Omit<React.ComponentProps<typeof RechartsLegend>, "content"> & {
    content?: React.ReactNode;
  }
) {
  const { content, ...rest } = props;
  return <RechartsLegend {...rest} content={content as any} />;
}

export function ChartLegendContent() {
  const config = useChartConfig();
  return function RenderLegend({ payload }: any) {
    if (!payload || payload.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-3 px-2 py-1">
        {payload.map((item: any, idx: number) => {
          const key = (item?.dataKey as string) ?? String(idx);
          const cfg = config?.[key];
          const name = cfg?.label ?? item?.value ?? key;
          const color = cfg?.color ?? item?.color;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="whitespace-nowrap">{name}</span>
            </div>
          );
        })}
      </div>
    );
  } as any;
}

export function getChartColorsFromCssVariables(keys: string[]): string[] {
  if (typeof window === "undefined") return keys.map(() => "#8884d8");
  const styles = getComputedStyle(document.documentElement);
  return keys.map((k) => styles.getPropertyValue(k).trim() || "#8884d8");
}
