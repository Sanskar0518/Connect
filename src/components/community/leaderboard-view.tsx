"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Flame, Award, Filter, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  college: string;
  targetRole: string;
  xp: number;
  score: number;
  streak: number;
  readinessScore: number;
  badgesCount: number;
  isUser: boolean;
  isAnonymous: boolean;
}

export function LeaderboardView() {
  const [period, setPeriod] = useState<"weekly" | "all-time">("weekly");
  const [filter, setFilter] = useState<"all" | "college" | "track">("all");
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userOptedOut, setUserOptedOut] = useState(false);
  const [userCollege, setUserCollege] = useState<string | null>(null);
  const [userTrack, setUserTrack] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/community/leaderboard?period=${period}&filter=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.leaderboard || []);
        setUserRank(data.userRank);
        setUserOptedOut(data.userOptedOut);
        setUserCollege(data.userCollege);
        setUserTrack(data.userTrack);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period, filter]);

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        {/* Period Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === "weekly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Weekly Sprint
          </button>
          <button
            onClick={() => setPeriod("all-time")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === "all-time"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All-Time Hall of Fame
          </button>
        </div>

        {/* Scope Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Cohort Peers</option>
            {userCollege && <option value="college">My College ({userCollege})</option>}
            {userTrack && <option value="track">My Track ({userTrack})</option>}
          </select>
        </div>
      </div>

      {userOptedOut && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3 text-xs text-foreground">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
          <div>
            <span className="font-bold">You are currently opted out of the public leaderboard.</span>
            <p className="text-muted-foreground mt-0.5">
              Your profile is hidden from peers. You can re-enable public benchmarking anytime in the Privacy tab.
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Podium Highlights */}
      {!loading && items.length >= 3 && filter === "all" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 */}
          <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-2 order-2 sm:order-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/30 text-foreground font-extrabold text-sm border border-slate-400/30">
              🥈 2
            </span>
            <h3 className="font-bold text-sm text-foreground truncate">{items[1]?.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{items[1]?.college}</p>
            <div className="text-xs font-mono font-bold text-primary">
              {items[1]?.score} {period === "weekly" ? "Pts" : "XP"}
            </div>
          </div>

          {/* Rank 1 */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-accent/15 via-card to-card border-2 border-accent/40 text-center space-y-2 order-1 sm:order-2 shadow-sm">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-extrabold text-base border border-accent/40">
              👑 1
            </span>
            <h3 className="font-bold text-base text-foreground truncate">{items[0]?.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{items[0]?.college}</p>
            <div className="text-sm font-mono font-extrabold text-accent">
              {items[0]?.score} {period === "weekly" ? "Pts" : "XP"}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3 fill-current" /> {items[0]?.streak}d streak
            </div>
          </div>

          {/* Rank 3 */}
          <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-2 order-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-300 font-extrabold text-sm border border-amber-600/30">
              🥉 3
            </span>
            <h3 className="font-bold text-sm text-foreground truncate">{items[2]?.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{items[2]?.college}</p>
            <div className="text-xs font-mono font-bold text-primary">
              {items[2]?.score} {period === "weekly" ? "Pts" : "XP"}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            <h2 className="font-bold text-sm text-foreground">
              {filter === "college"
                ? `${userCollege} Leaderboard`
                : filter === "track"
                ? `${userTrack} Cohort`
                : "National Higher-Ed Cohort Benchmarking"}
            </h2>
          </div>
          {userRank && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Your Rank: #{userRank}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Calculating peer ranking benchmarks...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No participants found matching this filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3">Role Focus</th>
                  <th className="py-2.5 px-3">Streak</th>
                  <th className="py-2.5 px-3">Badges</th>
                  <th className="py-2.5 px-3 text-right">
                    {period === "weekly" ? "Weekly Score" : "Total XP"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.userId}
                    className={`border-b border-border/50 transition-colors ${
                      item.isUser
                        ? "bg-primary/10 font-semibold border-primary/30"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                          item.rank === 1
                            ? "bg-accent/20 text-accent"
                            : item.rank === 2
                            ? "bg-slate-300/30 text-foreground"
                            : item.rank === 3
                            ? "bg-amber-700/20 text-amber-700 dark:text-amber-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground">{item.name}</span>
                        {item.isUser && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{item.college}</td>
                    <td className="py-3 px-3 text-muted-foreground truncate max-w-[140px]">
                      {item.targetRole}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-accent font-medium">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {item.streak}d
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Award className="w-3.5 h-3.5 text-accent" />
                        {item.badgesCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-primary">
                      {item.score} {period === "weekly" ? "Pts" : "XP"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
