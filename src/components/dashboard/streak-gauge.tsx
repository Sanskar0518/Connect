"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface StreakGaugeProps {
  currentStreak?: number;
  bestStreak?: number;
}

export function StreakGauge({ currentStreak = 0, bestStreak = 12 }: StreakGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate percentage toward best streak or 14-day goal
  const goal = Math.max(bestStreak, 14);
  const percent = Math.min(100, Math.max(5, Math.round((currentStreak / goal) * 100)));

  const data = [
    { name: "Current", value: percent },
    { name: "Remaining", value: 100 - percent },
  ];

  const COLORS = ["#4F46E5", "#EDE9FE"];

  return (
    <div className="flex flex-col items-center justify-between h-full pt-1">
      {/* Donut Gauge */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={70}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill="#4F46E5" />
                <Cell fill="#EDE9FE" className="dark:opacity-30" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-36 h-36 rounded-full border-8 border-muted animate-pulse" />
        )}

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          <span className="text-[11px] font-medium text-muted-foreground tracking-tight">
            Streak Data
          </span>
          <span className="text-2xl font-bold text-foreground tracking-tight leading-tight my-0.5">
            {currentStreak} Days
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Best: {bestStreak} Days
          </span>
        </div>
      </div>

      {/* Footer text matching reference */}
      <p className="text-xs text-center text-muted-foreground mt-4 px-2">
        Complete today&apos;s node challenge to protect your streak bonus!
      </p>
    </div>
  );
}
