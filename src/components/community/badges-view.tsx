"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Flame,
  Rocket,
  FileCheck,
  Compass,
  Trophy,
  Target,
  CheckCircle,
  Lock,
  Loader2,
} from "lucide-react";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isEarned: boolean;
  earnedAt: string | null;
}

const ICON_MAP: Record<string, any> = {
  Rocket,
  Flame,
  FileCheck,
  Award,
  Compass,
  Trophy,
  Target,
};

export function BadgesView() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/community/badges");
        const data = await res.json();
        if (res.ok) {
          setBadges(data.badges || []);
        }
      } catch (err) {
        console.error("Failed to load badges:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, []);

  const earnedCount = badges.filter((b) => b.isEarned).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            <span>Badges & Portfolio Trophy Room</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Earn verified badges by hitting milestones across mock interviews, resume ATS scans, roadmap mastery, and peer challenges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-center">
            <span className="block text-xl font-mono font-bold text-accent">
              {earnedCount} / {badges.length}
            </span>
            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">
              Badges Unlocked
            </span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading verified credentials...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => {
            const IconComponent = ICON_MAP[b.icon] || Award;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  b.isEarned
                    ? "bg-card border-accent/40 shadow-sm"
                    : "bg-muted/20 border-border opacity-70"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      b.isEarned
                        ? "bg-accent/15 border-accent/30 text-accent"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {b.isEarned ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                      <CheckCircle className="w-3.5 h-3.5 fill-secondary text-card" />
                      <span>Earned</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground">{b.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-wider font-semibold text-[10px]">
                    {b.category}
                  </span>
                  {b.earnedAt && (
                    <span>Unlocked {new Date(b.earnedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
