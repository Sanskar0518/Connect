import React from "react";
import { Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIBadgeProps {
  confidence?: number; // 0 to 1
  className?: string;
  label?: string;
}

export function AIBadge({ confidence, className, label = "AI-generated" }: AIBadgeProps) {
  const confidencePercent = confidence !== undefined ? Math.round(confidence * 100) : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20",
        className
      )}
      title={
        confidencePercent
          ? `Generated with ${confidencePercent}% model confidence. Evaluated against career frameworks.`
          : "Generated using Connect Career Intelligence AI."
      }
    >
      <Sparkles className="w-3 h-3 text-primary animate-pulse" />
      <span>{label}</span>
      {confidencePercent !== null && (
        <span className="text-[10px] opacity-75 font-mono ml-0.5">
          ({confidencePercent}%)
        </span>
      )}
      <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
    </span>
  );
}
