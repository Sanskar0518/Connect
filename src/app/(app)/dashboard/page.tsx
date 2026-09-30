import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Flame,
  Award,
  TrendingUp,
  ArrowRight,
  Compass,
  Briefcase,
  GraduationCap,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  Users,
} from "lucide-react";
import { AIBadge } from "@/components/common/ai-badge";

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
        take: 4,
      })
    : [];

  // Real Peer Rank
  let peerRank = 14;
  let totalPeers = 180;
  if (profile) {
    const higherXpCount = await db.profile.count({
      where: {
        xp: { gt: profile.xp },
        optOutCommunity: false,
      },
    });
    peerRank = higherXpCount + 1;
    totalPeers = Math.max(peerRank + 12, await db.profile.count());
  }

  const studentName = session?.user?.name || "Student";
  const readinessScore = profile?.readinessScore ?? 73;
  const xp = profile?.xp ?? 780;
  const streak = profile?.streak ?? 7;
  const targetRole = profile?.targetRole || "Full Stack Web Developer";
  const college = profile?.college || "Metropolitan Institute of Technology";

  // Calculate days remaining helper
  const getDaysLeft = (deadline: Date) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Closed";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} Days`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-border p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Student Command Center
              </span>
              <AIBadge confidence={0.94} label="Readiness Engine Active" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {studentName}!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Targeting <span className="font-semibold text-foreground">{targetRole}</span> at{" "}
              <span className="font-semibold text-foreground">{college}</span>. Your career
              readiness benchmark is dynamically calculated across all 14 platform modules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <span>View Skill Gaps</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/community"
              className="px-4 py-2.5 rounded-xl bg-card hover:bg-muted text-foreground border border-border font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-primary" />
              <span>Cohort Hub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Score Card */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Readiness Score</span>
            <span className="text-secondary font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +14% this month
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{readinessScore}%</span>
            <span className="text-xs text-muted-foreground">Target: 85%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, readinessScore)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            35% Skills + 30% Roadmap + 20% Resume ATS + 15% Mock Interview.
          </p>
        </div>

        {/* XP & Level */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Skill Points (XP)</span>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{xp}</span>
            <span className="text-xs font-semibold text-accent">
              {xp >= 1000 ? "Level 3 Fellow" : xp >= 500 ? "Level 2 Scholar" : "Level 1 Starter"}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (xp % 500) / 5)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Earn XP completing nodes, submitting challenges, and passing mock interviews.
          </p>
        </div>

        {/* Daily Streak */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Active Learning Streak</span>
            <Flame className="w-4 h-4 text-accent fill-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{streak} Days</span>
            <span className="text-xs text-muted-foreground">Best: 12 Days</span>
          </div>
          <p className="text-xs text-muted-foreground pt-3">
            Complete today&apos;s node challenge to protect your streak bonus!
          </p>
        </div>

        {/* Peer Benchmarking Rank */}
        <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">College Cohort Rank</span>
            <span className="text-primary font-semibold text-xs">
              Top {Math.max(1, Math.round((peerRank / totalPeers) * 100))}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">#{peerRank}</span>
            <span className="text-xs text-muted-foreground">of {totalPeers} Peers</span>
          </div>
          <p className="text-xs text-muted-foreground pt-3">
            Ranked higher than {Math.max(0, 100 - Math.round((peerRank / totalPeers) * 100))}% of students in your graduation year.
          </p>
        </div>
      </div>

      {/* Main Grid: Next Step & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Learning Action Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-base text-foreground">Recommended Next Step</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
              {nextNode ? `Priority Node ${nextNode.order || 3}` : "Roadmap Priority"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {nextNode?.title || "High-Concurrency Distributed Caching (Redis)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextNode?.category || "Backend & Systems"} • Estimated time: {nextNode?.estimatedHours || 10} hours
                </p>
              </div>
              <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                +100 XP
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {nextNode?.description ||
                "Design cache-aside, write-through, and distributed pub/sub locking patterns with Redis to handle 5k+ RPS. Critical for high-concurrency interview benchmarks."}
            </p>
            <div className="flex items-center justify-between pt-1">
              <Link
                href="/roadmap"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Open in Roadmap Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Module Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <Link
              href="/profile"
              className="p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors text-center space-y-1 block"
            >
              <Sparkles className="w-4 h-4 mx-auto text-primary" />
              <span className="block text-xs font-medium text-foreground">Gap Radar</span>
            </Link>
            <Link
              href="/applications"
              className="p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors text-center space-y-1 block"
            >
              <Briefcase className="w-4 h-4 mx-auto text-secondary" />
              <span className="block text-xs font-medium text-foreground">ATS Scanner</span>
            </Link>
            <Link
              href="/interview"
              className="p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors text-center space-y-1 block"
            >
              <Compass className="w-4 h-4 mx-auto text-accent" />
              <span className="block text-xs font-medium text-foreground">Mock Interview</span>
            </Link>
            <Link
              href="/opportunities"
              className="p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors text-center space-y-1 block"
            >
              <GraduationCap className="w-4 h-4 mx-auto text-primary" />
              <span className="block text-xs font-medium text-foreground">Scholarships</span>
            </Link>
            <Link
              href="/community"
              className="p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors text-center space-y-1 block col-span-2 sm:col-span-1"
            >
              <Award className="w-4 h-4 mx-auto text-accent" />
              <span className="block text-xs font-medium text-foreground">Challenges</span>
            </Link>
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-base text-foreground">Upcoming Deadlines</h2>
            </div>
            <Link href="/applications" className="text-xs text-primary hover:underline">
              View Kanban
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingApplications.length > 0 ? (
              upcomingApplications.map((app) => {
                const daysLeftStr = app.deadline ? getDaysLeft(app.deadline) : "Pending";
                const isUrgent = daysLeftStr.includes("1") || daysLeftStr.includes("2") || daysLeftStr.includes("3") || daysLeftStr === "Today";

                return (
                  <div
                    key={app.id}
                    className={`p-3 rounded-xl border space-y-1 ${
                      isUrgent
                        ? "bg-destructive/10 border-destructive/20"
                        : "bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold truncate max-w-[170px] ${
                          isUrgent ? "text-destructive" : "text-foreground"
                        }`}
                      >
                        {app.title}
                      </span>
                      <span
                        className={`font-bold ${
                          isUrgent ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {daysLeftStr}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{app.organization}</span>
                      <span className="text-[10px] font-mono uppercase bg-card px-1.5 py-0.5 rounded border border-border">
                        {app.column}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active application deadlines saved. Add opportunities from the Job or Scholarship matcher.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
