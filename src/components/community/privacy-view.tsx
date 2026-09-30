"use client";

import React, { useState, useEffect } from "react";
import { Shield, EyeOff, UserX, Check, Loader2, Info } from "lucide-react";

export function PrivacyView() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [optOutCommunity, setOptOutCommunity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/community/privacy");
        const data = await res.json();
        if (res.ok) {
          setIsAnonymous(data.isAnonymous);
          setOptOutCommunity(data.optOutCommunity);
        }
      } catch (err) {
        console.error("Failed to load privacy settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (newAnon: boolean, newOptOut: boolean) => {
    try {
      setSaving(true);
      const res = await fetch("/api/community/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAnonymous: newAnon,
          optOutCommunity: newOptOut,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Privacy update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAnonymous = (val: boolean) => {
    setIsAnonymous(val);
    handleSave(val, optOutCommunity);
  };

  const handleToggleOptOut = (val: boolean) => {
    setOptOutCommunity(val);
    handleSave(isAnonymous, val);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div>
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Community Privacy & Benchmarking Controls</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            F14 Privacy Guarantee: You maintain total granular control over how your learning progress, name, and institution appear to cohort peers.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 flex items-center gap-2 text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>Privacy preferences saved successfully!</span>
          </div>
        )}

        <div className="divide-y divide-border/60">
          {/* Anonymous Mode Toggle */}
          <div className="py-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-bold text-sm text-foreground">Anonymous Mode</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                When enabled, your name and profile avatar will be masked as &quot;Anonymous Student&quot; on community feed posts and public leaderboard rows. Your XP and streak continue to track privately.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => handleToggleAnonymous(e.target.checked)}
                disabled={loading || saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Opt-out of Leaderboards Toggle */}
          <div className="py-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-bold text-sm text-foreground">Opt-Out of Cohort Leaderboards</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Completely exclude your profile from the public college and track leaderboards. You will still receive XP, streaks, and personal readiness metrics, but peers will not see your entry.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={optOutCommunity}
                onChange={(e) => handleToggleOptOut(e.target.checked)}
                disabled={loading || saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-destructive"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Bias Awareness & Data Policy Note */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Bias Awareness & Data Ethics:</strong> Cohort benchmarking is designed purely for positive motivation and mutual learning. Rankings never impact AI interview evaluations, scholarship matching, or job recommendation rankings.
        </p>
      </div>
    </div>
  );
}
