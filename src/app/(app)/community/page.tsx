"use client";

import React, { useState } from "react";
import { Users, Trophy, MessageSquare, Award, Shield } from "lucide-react";
import { AIBadge } from "@/components/common/ai-badge";
import { LeaderboardView } from "@/components/community/leaderboard-view";
import { FeedView } from "@/components/community/feed-view";
import { ChallengesView } from "@/components/community/challenges-view";
import { BadgesView } from "@/components/community/badges-view";
import { PrivacyView } from "@/components/community/privacy-view";

type Tab = "leaderboard" | "feed" | "challenges" | "badges" | "privacy";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Peer Learning & Social Benchmarking Hub
            </h1>
            <AIBadge confidence={0.96} label="Module 6 • F14" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Celebrate milestones, benchmark your progress with college peers, tackle weekly skill challenges, and inspect verified badges.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 sm:gap-6 text-xs sm:text-sm font-semibold text-muted-foreground overflow-x-auto">
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`pb-3 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "leaderboard"
              ? "text-primary border-b-2 border-primary"
              : "hover:text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`pb-3 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "feed"
              ? "text-primary border-b-2 border-primary"
              : "hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Activity Feed</span>
        </button>

        <button
          onClick={() => setActiveTab("challenges")}
          className={`pb-3 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "challenges"
              ? "text-primary border-b-2 border-primary"
              : "hover:text-foreground"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Peer Challenges</span>
        </button>

        <button
          onClick={() => setActiveTab("badges")}
          className={`pb-3 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "badges"
              ? "text-primary border-b-2 border-primary"
              : "hover:text-foreground"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges</span>
        </button>

        <button
          onClick={() => setActiveTab("privacy")}
          className={`pb-3 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "privacy"
              ? "text-primary border-b-2 border-primary"
              : "hover:text-foreground"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & Anonymity</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "leaderboard" && <LeaderboardView />}
        {activeTab === "feed" && <FeedView />}
        {activeTab === "challenges" && <ChallengesView />}
        {activeTab === "badges" && <BadgesView />}
        {activeTab === "privacy" && <PrivacyView />}
      </div>
    </div>
  );
}
