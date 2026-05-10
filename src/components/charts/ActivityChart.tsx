"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import type { DailyActivityPoint } from "@/types/stats";

interface ActivityChartProps {
  data: DailyActivityPoint[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-sm text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{payload[0].value} transactions</p>
      </div>
    );
  }
  return null;
};

export function ActivityChart({ data }: ActivityChartProps) {
  const last30 = data.slice(-30).map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    txCount: d.txCount,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily Activity (last 30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {last30.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No activity data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last30} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="txCount" fill="hsl(262, 83%, 58%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
