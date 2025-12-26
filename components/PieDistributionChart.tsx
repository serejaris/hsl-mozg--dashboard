"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLOR_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const;

export type PieDataItem = {
  name: string;
  value: number;
  key: string;
};

export type PieDistributionChartProps = {
  title?: string;
  data: PieDataItem[];
  height?: number;
};

export default function PieDistributionChart({ title, data, height = 280 }: PieDistributionChartProps) {
  const chartConfig: ChartConfig = React.useMemo(() => {
    const entries: [string, { label: string; color?: string }][] = data.map((d, idx) => [
      d.key,
      {
        label: d.name,
      },
    ]);
    return Object.fromEntries(entries);
  }, [data]);

  const colors = React.useMemo(() => {
    if (typeof window === "undefined") return ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    const styles = getComputedStyle(document.documentElement);
    return COLOR_VARS.map((v) => styles.getPropertyValue(v).trim());
  }, []);

  return (
    <div className="w-full">
      {title ? <div className="mb-2 text-sm font-medium opacity-80">{title}</div> : null}
      <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.max(80, Math.floor(height * 0.32))}
              innerRadius={Math.max(48, Math.floor(height * 0.18))}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={entry.key} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}


