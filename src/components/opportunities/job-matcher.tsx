"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  MapPin,
  Clock,
  TrendingUp,
  ChevronRight,
  Star,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Filter,
} from "lucide-react";

interface JobMatch {
  jobId: string;
  matchScore: number;
  skillOverlap: string[];
  skillGaps: string[];
  whyMatch: string;
  applicationTip: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string | null;
    deadline: string | null;
    url: string;
  };
}

interface UserProfile {
  targetRole: string;
  readinessPct: number;
  skillCount: number;
}

export default function JobMatcher() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/opportunities/match");
      if (!res.ok) throw new Error("Failed to load matches");
      const data = await res.json();
      setMatches(data.matches || []);
      setProfile(data.userProfile || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const filtered = matches.filter((m) => {
    if (filter === "high") return m.matchScore >= 75;
    if (filter === "medium") return m.matchScore >= 50 && m.matchScore < 75;
    return true;
  });

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/15 border-emerald-500/30";
    if (score >= 60) return "bg-amber-500/15 border-amber-500/30";
    return "bg-red-500/15 border-red-500/30";
  };

  const typeIcon = (type: string) => {
    if (type === "INTERNSHIP") return "🎓";
    if (type === "REMOTE") return "🌐";
    return "💼";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">AI is matching you with opportunities…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-white/60">{error}</p>
        <button onClick={fetchMatches} className="px-4 py-2 bg-white/10 rounded-xl text-white text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Profile Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Job Matcher</h2>
            <p className="text-white/50 text-sm">
              {profile ? `${matches.length} matches for "${profile.targetRole}"` : "Personalized opportunity matches"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/70">
                Readiness: <span className="text-cyan-400 font-semibold">{profile.readinessPct.toFixed(0)}%</span>
              </span>
            </div>
          )}
          <button
            onClick={fetchMatches}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            title="Refresh matches"
          >
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-white/40" />
        {(["all", "high", "medium"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-cyan-600 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {f === "high" ? "High Match (75%+)" : f === "medium" ? "Medium (50–75%)" : "All"}
          </button>
        ))}
        <span className="ml-auto text-white/30 text-xs">{filtered.length} results</span>
      </div>

      {/* Match Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No matches in this filter. Try &quot;All&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
            <div
              key={match.jobId}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpanded(expanded === match.jobId ? null : match.jobId)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                {/* Score Badge */}
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-xl border flex flex-col items-center justify-center ${scoreBg(match.matchScore)}`}
                >
                  <span className={`text-lg font-black ${scoreColor(match.matchScore)}`}>
                    {match.matchScore}
                  </span>
                  <span className="text-white/30 text-xs">%</span>
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold truncate">{match.job.title}</span>
                    <span className="text-white/40 text-sm">{typeIcon(match.job.type)}</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/50">
                      {match.job.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-white/60 text-sm">{match.job.company}</span>
                    {match.job.location && (
                      <span className="flex items-center gap-1 text-white/40 text-xs">
                        <MapPin className="w-3 h-3" />
                        {match.job.location}
                      </span>
                    )}
                    {match.job.salary && (
                      <span className="text-emerald-400 text-xs">{match.job.salary}</span>
                    )}
                    {match.job.deadline && (
                      <span className="flex items-center gap-1 text-amber-400 text-xs">
                        <Clock className="w-3 h-3" />
                        Due {new Date(match.job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${
                    expanded === match.jobId ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Expanded Detail */}
              {expanded === match.jobId && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {/* Why Match */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                    <p className="text-xs text-cyan-400 font-medium mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> WHY YOU MATCH
                    </p>
                    <p className="text-sm text-white/80">{match.whyMatch}</p>
                  </div>

                  {/* Skills */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-emerald-400 font-medium mb-2">✓ Skills You Have</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.skillOverlap.length ? (
                          match.skillOverlap.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-full text-xs">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/30 text-xs">None listed</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-amber-400 font-medium mb-2">⚡ Skills to Gain</p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.skillGaps.length ? (
                          match.skillGaps.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-full text-xs">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/30 text-xs">None — great match!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Application Tip */}
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                    <p className="text-xs text-violet-400 font-medium mb-1">💡 APPLICATION TIP</p>
                    <p className="text-sm text-white/70">{match.applicationTip}</p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={match.job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold text-center flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Apply Now
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
