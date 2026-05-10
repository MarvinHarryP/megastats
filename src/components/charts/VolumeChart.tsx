"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import type { DailyActivityPoint } from "@/types/stats";

interface VolumeChartProps {
  data: DailyActivityPoint[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  let cumulative = 0n;
  const chartData = data.map((d) => {
    cumulative += BigInt(d.volumeWei);
    const eth = Number(cumulative) / 1e18;
    return {
      date: format(parseISO(d.date), "MMM d"),
      eth: parseFloat(eth.toFixed(6)),
    };
  });

  const last30 = chartData.slice(-30);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Cumulative Volume (ETH)</CardTitle>
      </CardHeader>
      <CardContent>
        {last30.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No volume data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={last30} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(4)} ETH`, "Volume"]}
              />
              <Area
                type="monotone"
                dataKey="eth"
                stroke="hsl(210, 100%, 56%)"
                fill="url(#volGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
