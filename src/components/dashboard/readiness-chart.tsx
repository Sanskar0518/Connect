"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  starter: number;
  scholar: number;
}

const defaultMonthlyData: MonthlyData[] = [
  { month: "Dec\n2020", starter: 65, scholar: 42 },
  { month: "Jan\n2020", starter: 58, scholar: 35 },
  { month: "Feb\n2020", starter: 62, scholar: 45 },
  { month: "Apr\n2020", starter: 50, scholar: 48 },
  { month: "May\n2021", starter: 75, scholar: 55 },
  { month: "Jun\n2021", starter: 82, scholar: 52 },
  { month: "Jul\n2020", starter: 68, scholar: 40 },
  { month: "Aug\n2020", starter: 58, scholar: 50 },
  { month: "Sep\n2020", starter: 60, scholar: 38 },
  { month: "Oct\n2020", starter: 55, scholar: 64 },
  { month: "Nov\n2020", starter: 70, scholar: 58 },
  { month: "Dec\n2020", starter: 78, scholar: 52 },
];

export function ReadinessMonthlyChart({ data = defaultMonthlyData }: { data?: MonthlyData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-44 w-full bg-muted/20 animate-pulse rounded-lg" />;
  }

  return (
    <div className="w-full">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
            barGap={2}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#94A3B8" }}
              interval={0}
              tickFormatter={(val: string) => val.replace("\n", " ")}
            />
            <YAxis
              hide
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover/95 backdrop-blur-md border border-border px-2.5 py-1.5 rounded-lg shadow-lg text-[11px] space-y-0.5">
                      <p className="font-semibold text-foreground">{label?.replace("\n", " ")}</p>
                      <p className="text-[#3B82F6] font-medium">
                        Level 1 Starter: {payload[0]?.value}%
                      </p>
                      <p className="text-[#93C5FD] font-medium">
                        Level 2 Scholar: {payload[1]?.value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="starter"
              fill="#3B82F6"
              radius={[3, 3, 0, 0]}
              maxBarSize={8}
            />
            <Bar
              dataKey="scholar"
              fill="#BFDBFE"
              radius={[3, 3, 0, 0]}
              maxBarSize={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below the chart matching reference */}
      <div className="flex items-center gap-6 mt-2 text-[11px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
          <span className="text-foreground/80">Level 1 Starter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#BFDBFE]" />
          <span className="text-foreground/80">Level 2 Scholar</span>
        </div>
      </div>
    </div>
  );
}
