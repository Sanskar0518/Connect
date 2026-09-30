"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from "recharts";

interface CohortRankChartProps {
  rank?: number;
  totalPeers?: number;
  topPercent?: number;
}

const trendData = [
  { point: "01", rankScore: 35, cohortAvg: 45 },
  { point: "02", rankScore: 28, cohortAvg: 50 },
  { point: "03", rankScore: 52, cohortAvg: 48 },
  { point: "04", rankScore: 48, cohortAvg: 58 },
  { point: "05", rankScore: 38, cohortAvg: 52 },
  { point: "06", rankScore: 68, cohortAvg: 60 },
];

export function CohortRankChart({
  rank = 10,
  totalPeers = 22,
  topPercent = 45,
}: CohortRankChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const percentile = 100 - topPercent;

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Header with Top Badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-foreground">College Cohort Rank</h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] dark:bg-primary/20 dark:text-primary">
          Top {topPercent}%
        </span>
      </div>

      {/* Main Rank Display */}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold text-foreground">#{rank}</span>
          <span className="text-sm font-semibold text-muted-foreground">of {totalPeers} Peers</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ranked higher than {percentile}% of students in your graduation year.
        </p>
      </div>

      {/* Mini Trend Line Chart */}
      <div className="w-full h-24 pt-2">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <XAxis
                dataKey="point"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border px-2 py-1 rounded shadow text-[10px]">
                        <span>Rank Trend: {payload[0]?.value}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="cohortAvg"
                stroke="#C7D2FE"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="rankScore"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-muted/20 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
}
