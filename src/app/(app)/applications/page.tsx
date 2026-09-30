"use client";

import { useState } from "react";
import { Briefcase, FileText, Calendar, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues with stateful client components
const ResumeOptimizer = dynamic(
  () => import("@/components/resume/resume-optimizer"),
  { ssr: false, loading: () => <LoadingState /> }
);
const JobMatcher = dynamic(
  () => import("@/components/opportunities/job-matcher"),
  { ssr: false, loading: () => <LoadingState /> }
);
const DeadlineTracker = dynamic(
  () => import("@/components/opportunities/deadline-tracker"),
  { ssr: false, loading: () => <LoadingState /> }
);

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const TABS = [
  {
    id: "matcher" as const,
    label: "Job Matcher",
    icon: Briefcase,
    badge: "F7",
    color: "from-cyan-500 to-blue-600",
    description: "AI-ranked internship & job matches",
  },
  {
    id: "resume" as const,
    label: "Resume Optimizer",
    icon: FileText,
    badge: "F5",
    color: "from-violet-500 to-purple-600",
    description: "ATS score + AI-powered rewrites",
  },
  {
    id: "deadlines" as const,
    label: "Deadline Tracker",
    icon: Calendar,
    badge: "F12",
    color: "from-amber-500 to-orange-600",
    description: "All deadlines in one place",
  },
];

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<"matcher" | "resume" | "deadlines">("matcher");

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Career Applications
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </span>
          </div>
          <p className="text-sm text-white/50 mt-1">
            AI resume scoring, intelligent job matching, and deadline tracking — all in one place.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                isActive
                  ? "border-white/20 bg-white/10"
                  : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tab.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isActive ? "text-white" : "text-white/70"}`}>
                    {tab.label}
                  </span>
                  <span className="px-1.5 py-0.5 bg-white/10 text-white/40 rounded text-[10px] font-mono">
                    {tab.badge}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-0.5 truncate">{tab.description}</p>
              </div>
              {isActive && (
                <div
                  className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${tab.color}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "matcher" && <JobMatcher />}
        {activeTab === "resume" && <ResumeOptimizer />}
        {activeTab === "deadlines" && <DeadlineTracker />}
      </div>
    </div>
  );
}
