"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export interface RadarDataPoint {
  skill: string;
  student: number;
  benchmark: number;
}

interface SkillRadarChartProps {
  data: RadarDataPoint[];
  companyName?: string;
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export function SkillRadarChart({ data, companyName, className }: SkillRadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-muted-foreground text-sm ${className || ""}`}>
        No data to display. Upload a transcript to generate your radar chart.
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickCount={5}
          />
          <Radar
            name="You"
            dataKey="student"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name={companyName || "Benchmark"}
            dataKey="benchmark"
            stroke="hsl(var(--secondary))"
            fill="hsl(var(--secondary))"
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
