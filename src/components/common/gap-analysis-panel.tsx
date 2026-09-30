"use client";

import { AlertCircle, TrendingUp } from "lucide-react";

type Severity = "Critical" | "Important" | "Nice-to-have";

interface MissingSkill {
  skill: string;
  severity: Severity;
  reason: string;
}

interface MatchedSkill {
  skill: string;
  confidence: number;
}

interface GapAnalysisPanelProps {
  targetRole: string;
  readinessPct: number;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  summary: string;
  source?: string;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/30",
  Important: "bg-warning/10 text-warning border-warning/30",
  "Nice-to-have": "bg-muted text-muted-foreground border-border",
};

const SEVERITY_DOT: Record<Severity, string> = {
  Critical: "bg-destructive",
  Important: "bg-yellow-500",
  "Nice-to-have": "bg-muted-foreground",
};

export function GapAnalysisPanel({
  targetRole,
  readinessPct,
  matchedSkills,
  missingSkills,
  summary,
  source,
}: GapAnalysisPanelProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (readinessPct / 100) * circumference;

  const scoreColor =
    readinessPct >= 70
      ? "hsl(var(--secondary))"
      : readinessPct >= 45
      ? "hsl(45 90% 55%)"
      : "hsl(var(--destructive))";

  return (
    <div className="space-y-6">
      {/* Readiness Score Ring */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-muted/30 rounded-2xl border border-border">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground" style={{ color: scoreColor }}>
              {readinessPct}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Readiness</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">
            {targetRole}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          {source && (
            <p className="text-[10px] text-muted-foreground/60 font-mono">Source: {source}</p>
          )}
          <div className="flex items-center gap-4 pt-2 text-xs font-semibold">
            <span className="text-secondary">{matchedSkills.length} matched</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-destructive">{missingSkills.filter((g) => g.severity === "Critical").length} critical gaps</span>
          </div>
        </div>
      </div>

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold text-foreground">Skill Gaps</h4>
            <span className="text-xs text-muted-foreground">({missingSkills.length} identified)</span>
          </div>
          <div className="space-y-2">
            {missingSkills.map((gap) => (
              <div
                key={gap.skill}
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${SEVERITY_STYLES[gap.severity]}`}
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[gap.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{gap.skill}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                      {gap.severity}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{gap.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <h4 className="text-sm font-bold text-foreground">Matched Skills</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((ms) => (
              <div
                key={ms.skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-xs font-medium text-secondary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {ms.skill}
                <span className="text-[10px] text-secondary/70 font-mono">
                  {Math.round(ms.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
