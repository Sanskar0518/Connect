"use client";

import React, { useState } from "react";
import {
  Mic,
  FileText,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Award,
} from "lucide-react";
import { AIBadge } from "@/components/common/ai-badge";
import JDIntelligence from "@/components/interview/jd-intelligence";
import MockSimulator from "@/components/interview/mock-simulator";
import InterviewHistory from "@/components/interview/interview-history";

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "JD_INTEL" | "HISTORY">("SIMULATOR");
  const [preloadedMockConfig, setPreloadedMockConfig] = useState<any | null>(null);

  const handleLaunchMockFromJD = (config: any) => {
    setPreloadedMockConfig(config);
    setActiveTab("SIMULATOR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              AI Interview Preparation & Simulator
            </h1>
            <AIBadge confidence={0.94} label="Voice/Text Evaluator" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            F6, F10: Company and JD intelligence, predicted questions, real-time mock interviews with speech-to-text, and STAR-method scoring.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("SIMULATOR")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "SIMULATOR"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mock Simulator (F6)</span>
          </button>

          <button
            onClick={() => setActiveTab("JD_INTEL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "JD_INTEL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>JD Intelligence (F10)</span>
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "HISTORY"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Score Trends</span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div>
        {activeTab === "SIMULATOR" && (
          <MockSimulator
            preloadedConfig={preloadedMockConfig}
            onClearPreloaded={() => setPreloadedMockConfig(null)}
            onViewHistory={() => setActiveTab("HISTORY")}
          />
        )}

        {activeTab === "JD_INTEL" && (
          <JDIntelligence onLaunchMock={handleLaunchMockFromJD} />
        )}

        {activeTab === "HISTORY" && (
          <InterviewHistory onStartNew={() => setActiveTab("SIMULATOR")} />
        )}
      </div>
    </div>
  );
}
