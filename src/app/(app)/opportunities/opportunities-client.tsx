"use client";

import { useState } from "react";
import { GraduationCap, Landmark, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const JobMatcher = dynamic(
  () => import("@/components/opportunities/job-matcher"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

const ScholarshipFinderView = dynamic(
  () => import("@/components/opportunities/scholarship-finder-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

const GovOpportunitiesView = dynamic(
  () => import("@/components/opportunities/gov-opportunities-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

const TABS = [
  { id: "matcher" as const, label: "AI Job Matcher", icon: Sparkles },
  { id: "scholarships" as const, label: "Scholarships & Aid", icon: GraduationCap },
  { id: "government" as const, label: "Government Schemes", icon: Landmark },
];

export default function OpportunitiesClient() {
  const [activeTab, setActiveTab] = useState<"matcher" | "scholarships" | "government">("matcher");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Opportunities &amp; Financial Aid
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              AI-Matched
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Discover internships, scholarships, and government schemes tailored to your profile.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap " +
                (activeTab === tab.id
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === "matcher" && <JobMatcher />}
        {activeTab === "scholarships" && <ScholarshipFinderView />}
        {activeTab === "government" && <GovOpportunitiesView />}
      </div>
    </div>
  );
}
