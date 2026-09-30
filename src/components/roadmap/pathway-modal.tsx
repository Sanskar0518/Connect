"use client";

import React from "react";
import {
  X,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import { CareerPathwayRecommendation, PathwayItem } from "@/lib/ai/schemas/pathway";

interface PathwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: CareerPathwayRecommendation | null;
  isLoading: boolean;
  onSelectTrack: (trackSlug: string) => void;
  currentTrackSlug: string;
}

export function PathwayModal({
  isOpen,
  onClose,
  recommendation,
  isLoading,
  onSelectTrack,
  currentTrackSlug,
}: PathwayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                AI Career Pathway Recommendations (F3)
              </h2>
              <p className="text-xs text-muted-foreground">
                Matched against your transcript competencies, verified skills, and academic profile.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Analyzing transcripts & calculating pathway match scores...
              </p>
            </div>
          ) : recommendation ? (
            <>
              {/* Overall Analysis */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Curriculum Synthesis: </span>
                {recommendation.overallAnalysis}
              </div>

              {/* Primary Pathway Card */}
              <div className="p-6 rounded-2xl border-2 border-primary bg-card/80 relative overflow-hidden shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground">
                    ★ Primary Recommended Pathway ({recommendation.primaryTrack.matchPercentage}% Fit)
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-secondary flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {recommendation.primaryTrack.demandTrend}
                    </span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      {recommendation.primaryTrack.avgSalary}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {recommendation.primaryTrack.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {recommendation.primaryTrack.fitReason}
                  </p>
                </div>

                {/* Critical Gaps & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Critical Skills to Bridge
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendation.primaryTrack.criticalGaps.map((gap) => (
                        <span
                          key={gap}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Est. Time to Ready: </span>
                      <strong className="text-foreground">
                        {recommendation.primaryTrack.estimatedTimeToReadiness}
                      </strong>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTrack(recommendation.primaryTrack.trackSlug);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {currentTrackSlug === recommendation.primaryTrack.trackSlug
                        ? "Currently Active"
                        : "Activate Pathway"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Alternative Pathways */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Alternative Adjacent Pathways
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.alternativeTracks.map((alt) => (
                    <div
                      key={alt.trackSlug}
                      className="p-5 rounded-2xl border border-border bg-card hover:border-border/80 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {alt.matchPercentage}% Match
                          </span>
                          <span className="font-semibold text-secondary">{alt.demandTrend}</span>
                        </div>

                        <h4 className="font-bold text-base text-foreground">{alt.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {alt.fitReason}
                        </p>

                        <div className="text-[11px] text-muted-foreground pt-2">
                          <span className="font-semibold">Key Gaps: </span>
                          <span>{alt.criticalGaps.slice(0, 3).join(", ")}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{alt.avgSalary}</span>
                        <button
                          onClick={() => {
                            onSelectTrack(alt.trackSlug);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all"
                        >
                          Switch Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Unable to generate recommendations. Please ensure your profile has verified skills.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
