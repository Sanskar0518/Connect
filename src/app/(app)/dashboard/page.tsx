import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Calendar,
  Sparkles,
  Briefcase,
  Mic,
  GraduationCap,
  Award,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { ReadinessMonthlyChart } from "@/components/dashboard/readiness-chart";
import { StreakGauge } from "@/components/dashboard/streak-gauge";
import { SkillRatingBubbles } from "@/components/dashboard/skill-rating-bubbles";
import { CohortRankChart } from "@/components/dashboard/cohort-rank-chart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const profile = userId
    ? await db.profile.findUnique({
        where: { userId },
        include: {
          skills: {
            include: { skill: true },
          },
        },
      })
    : null;

  // Active Roadmap & Next Node
  const roadmap = userId
    ? await db.roadmap.findFirst({
        where: { userId },
        include: {
          nodes: {
            orderBy: { order: "asc" },
            include: {
              progress: {
                where: { userId },
              },
            },
          },
        },
      })
    : null;

  // Find next uncompleted node
  let nextNode = null;
  if (roadmap?.nodes) {
    nextNode =
      roadmap.nodes.find((n) => {
        const p = n.progress[0]?.status;
        return p === "IN_PROGRESS";
      }) ||
      roadmap.nodes.find((n) => {
        const p = n.progress[0]?.status;
        return p !== "COMPLETED";
      });
  }

  // Real Upcoming Deadlines from Applications
  const upcomingApplications = userId
    ? await db.application.findMany({
        where: {
          userId,
          deadline: { not: null },
        },
        orderBy: { deadline: "asc" },
        take: 3,
      })
    : [];

  // Cohort peer rank calculations
  let peerRank = 10;
  let totalPeers = 22;
  if (profile) {
    const higherXpCount = await db.profile.count({
      where: {
        xp: { gt: profile.xp },
        optOutCommunity: false,
      },
    });
    peerRank = Math.max(1, higherXpCount + 1);
    const dbPeers = await db.profile.count();
    totalPeers = Math.max(peerRank, dbPeers || 22);
  }

  const studentName = session?.user?.name || "Sanskar";
  const readinessScore = profile?.readinessScore ?? 0;
  const streak = profile?.streak ?? 0;
  const targetRole = profile?.targetRole || "Software Engineer";
  const college = profile?.college || "Metropolitan Institute of Technology";
  const topPercent = Math.max(1, Math.round((peerRank / totalPeers) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header Welcome Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {studentName}!
        </h1>
        <p className="text-sm text-muted-foreground max-w-4xl">
          Targeting <span className="font-semibold text-foreground">{targetRole}</span> at{" "}
          <span className="font-semibold text-foreground">{college}</span>. Your career
          readiness benchmark is dynamically calculated...
        </p>
      </div>

      {/* 2. Top Row: Readiness Score (2/3) & Active Learning Streak (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Readiness Score Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground">Readiness Score</h2>
            <Link
              href="/profile"
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            >
              View Report
            </Link>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-extrabold text-foreground">{readinessScore}%</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +14% this month
              </span>
              <span className="text-xs text-muted-foreground font-medium">Target: 85%</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium pt-1">
              35% Skills + 30% Roadmap + 20% Resume + ATS + 15% Mock Interview
            </p>
          </div>

          {/* Grouped Dual Bar Chart */}
          <div className="pt-2">
            <ReadinessMonthlyChart />
          </div>
        </div>

        {/* Right: Active Learning Streak Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground">Active Learning Streak</h2>
            <Link
              href="/roadmap"
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            >
              View Report
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center my-2">
            <StreakGauge currentStreak={streak} bestStreak={12} />
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Your Rating (1/3) + Recommended Next Step (1/3) + College Cohort Rank (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Your Rating Bubble Graphic Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <SkillRatingBubbles
            title="Skill Proficiency"
            subtitle="Core domain mastery across verified curriculum competencies"
            bubbles={{
              systemDesign: { percent: 85, label: "System Design" },
              problemSolving: { percent: 92, label: "Problem Solving" },
              techStack: { percent: 88, label: "Core Stack" },
            }}
          />
        </div>

        {/* Recommended Next Step Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-bold text-base text-foreground">Recommended Next Step</h2>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-bold text-foreground leading-snug">
                {nextNode?.title || "Advanced Core Programming & Types"}
              </h3>
              <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                {nextNode?.category || "TECHNICAL"} • Estimated time: {nextNode?.estimatedHours || 20} hours
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60">
            <Link
              href="/roadmap"
              className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA] dark:text-primary dark:hover:underline flex items-center gap-1.5 transition-colors group"
            >
              <span>Open in Roadmap Canvas</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* College Cohort Rank Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <CohortRankChart
            rank={peerRank}
            totalPeers={totalPeers}
            topPercent={topPercent}
          />
        </div>
      </div>

      {/* 4. Bottom Row: 5 Quick Action Cards (Left) & Upcoming Deadlines (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* 5 Quick Action Module Buttons (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/profile"
            className="p-4 rounded-2xl bg-card border border-border hover:border-[#4F46E5]/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">Gap Radar</span>
          </Link>

          <Link
            href="/applications"
            className="p-4 rounded-2xl bg-card border border-border hover:border-[#4F46E5]/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">ATS Scanner</span>
          </Link>

          <Link
            href="/interview"
            className="p-4 rounded-2xl bg-card border border-border hover:border-[#4F46E5]/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">Mock Interview</span>
          </Link>

          <Link
            href="/opportunities"
            className="p-4 rounded-2xl bg-card border border-border hover:border-[#4F46E5]/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">Scholarships</span>
          </Link>

          <Link
            href="/community"
            className="p-4 rounded-2xl bg-card border border-border hover:border-[#4F46E5]/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground">Challenges</span>
          </Link>
        </div>

        {/* Right: Upcoming Deadlines Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">Upcoming Deadlines</h2>
            </div>
            <Link
              href="/applications"
              className="text-xs font-semibold text-[#4F46E5] hover:underline"
            >
              View Kanban
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {upcomingApplications.length > 0 ? (
              <div className="w-full space-y-2">
                {upcomingApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold truncate max-w-[150px]">{app.title}</span>
                    <span className="text-muted-foreground font-mono">{app.organization}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
                No active application deadlines saved. Add opportunities from the Job or Scholarship matcher
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
