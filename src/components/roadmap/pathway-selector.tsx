"use client";

import React, { useState } from "react";
import {
  Compass,
  TrendingUp,
  DollarSign,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
} from "lucide-react";
import { PathwayItem } from "@/lib/ai/schemas/pathway";

export interface CareerTrackSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  avgSalary: string;
  demandTrend: string;
  category: string;
  requiredSkills: string[];
}

interface PathwaySelectorProps {
  tracks: CareerTrackSummary[];
  selectedTrackSlug: string;
  onSelectTrack: (slug: string) => void;
  progress: number;
  completedNodes: number;
  totalNodes: number;
  onRegenerate: () => void;
  isGenerating?: boolean;
  onOpenRecommendations: () => void;
}

export function PathwaySelector({
  tracks,
  selectedTrackSlug,
  onSelectTrack,
  progress,
  completedNodes,
  totalNodes,
  onRegenerate,
  isGenerating = false,
  onOpenRecommendations,
}: PathwaySelectorProps) {
  const currentTrack =
    tracks.find((t) => t.slug === selectedTrackSlug) || tracks[0] || {
      title: "Full Stack Web Developer",
      slug: "full-stack-web-developer",
      category: "Software Engineering",
      avgSalary: "$95,000 - $145,000",
      demandTrend: "+21% YoY",
    };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Track Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {currentTrack.category}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-secondary">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{currentTrack.demandTrend}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>{currentTrack.avgSalary}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {currentTrack.title}
            </h2>

            {/* Quick Track Switcher Dropdown */}
            <div className="relative inline-block">
              <select
                aria-label="Select career track"
                value={selectedTrackSlug}
                onChange={(e) => onSelectTrack(e.target.value)}
                className="appearance-none bg-muted/60 hover:bg-muted border border-border text-xs font-semibold px-3 py-1.5 pr-7 rounded-xl text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {tracks.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    Switch Track: {t.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenRecommendations}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Pathway Fit (F3)</span>
          </button>

          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Synthesizing..." : "Regenerate Tree"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Completion Metrix */}
      <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Roadmap Mastery</span>
            <span className="font-bold text-foreground">
              {completedNodes} of {totalNodes} Milestones ({progress}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Done ({completedNodes})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
            <span>Upcoming ({Math.max(totalNodes - completedNodes, 0)})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
