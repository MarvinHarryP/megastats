"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subDays, format, startOfWeek, eachDayOfInterval, parseISO } from "date-fns";

interface Props {
  data: { date: string; txCount: number }[];
}

const WEEKS = 26;
const DAYS_IN_WEEK = 7;
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function getColor(count: number, isFuture = false) {
  if (isFuture) return "bg-transparent";
  if (count === 0) return "bg-gray-200 dark:bg-gray-700";
  if (count <= 2) return "bg-green-200 dark:bg-green-900";
  if (count <= 5) return "bg-green-400 dark:bg-green-700";
  if (count <= 10) return "bg-green-500 dark:bg-green-600";
  return "bg-green-600 dark:bg-green-500";
}

export function ActivityHeatmap({ data }: Props) {
  const { grid, months, todayStr } = useMemo(() => {
    const txByDate = new Map(data.map((d) => [d.date, d.txCount]));

    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const start = startOfWeek(subDays(today, WEEKS * 7 - 1), { weekStartsOn: 1 });
    // Extend end to Sunday of current week so the grid is always full
    const endOfCurrentWeek = startOfWeek(subDays(today, -6), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end: endOfCurrentWeek });

    // Pad to full weeks
    const weeks: { date: string; count: number }[][] = [];
    let week: { date: string; count: number }[] = [];
    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      week.push({ date: dateStr, count: txByDate.get(dateStr) ?? 0 });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) weeks.push(week);

    // Month labels: find first week of each month
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = "";
    weeks.forEach((w, i) => {
      const m = format(parseISO(w[0].date), "MMM");
      if (m !== lastMonth) {
        monthLabels.push({ label: m, col: i });
        lastMonth = m;
      }
    });

    return { grid: weeks, months: monthLabels, todayStr };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Activity — last 6 months
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-[3px] w-full min-w-0">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] shrink-0 mr-1">
            <div className="h-4 text-[10px]" />
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="h-[10px] text-[10px] text-muted-foreground leading-[10px] w-6">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks — flex-1 so they fill the full card width */}
          {grid.map((week, wi) => {
            const monthLabel = months.find((m) => m.col === wi);
            return (
              <div key={wi} className="flex flex-col gap-[3px] flex-1 min-w-0">
                <div className="h-4 text-[10px] text-muted-foreground whitespace-nowrap overflow-hidden">
                  {monthLabel?.label ?? ""}
                </div>
                {week.map((day, di) => {
                  const isFuture = day.date > todayStr;
                  return (
                    <div
                      key={di}
                      title={isFuture ? "" : `${day.date}: ${day.count} tx`}
                      className={`w-full h-[10px] rounded-[2px] ${getColor(day.count, isFuture)}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {["bg-muted", "bg-green-200 dark:bg-green-900", "bg-green-400 dark:bg-green-700", "bg-green-600 dark:bg-green-500"].map((c, i) => (
            <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </CardContent>
    </Card>
  );
}
