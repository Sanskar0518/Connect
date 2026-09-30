"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  BarChart2,
  Loader2,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import InterviewFeedbackView, {
  InterviewFeedbackData,
} from "./interview-feedback-view";

interface SessionSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  turnsCount: number;
  answeredTurnsCount: number;
  feedback: InterviewFeedbackData | null;
}

interface TrendPoint {
  sessionNumber: number;
  title: string;
  date: string;
  overallScore: number;
  contentScore: number;
  clarityScore: number;
  structureScore: number;
  confidenceScore: number;
}

interface InterviewHistoryProps {
  onStartNew?: () => void;
}

export default function InterviewHistory({ onStartNew }: InterviewHistoryProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview/session");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setTrend(data.trend || []);
        setStats(
          data.stats || {
            totalSessions: 0,
            completedSessions: 0,
            averageScore: 0,
          }
        );
      }
    } catch (err) {
      console.error("Failed to load interview history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleReviewSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/interview/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSessionDetails(data.interview);
      }
    } catch (err) {
      console.error("Failed to load session details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this interview record?")) return;

    try {
      const res = await fetch(`/api/interview/session/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
          setSelectedSessionDetails(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-xs text-muted-foreground">Loading interview sessions & analytics...</p>
      </div>
    );
  }

  // If reviewing a specific past session
  if (selectedSessionId && selectedSessionDetails) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setSelectedSessionId(null);
            setSelectedSessionDetails(null);
          }}
          className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-2 transition-colors border border-border"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close Review & Return to History</span>
        </button>

        <InterviewFeedbackView
          sessionTitle={selectedSessionDetails.title}
          sessionType={selectedSessionDetails.type}
          feedback={selectedSessionDetails.feedback}
          turns={selectedSessionDetails.turns}
          onRestart={onStartNew}
          onViewHistory={() => {
            setSelectedSessionId(null);
            setSelectedSessionDetails(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Completed Sessions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {stats.completedSessions}
            </span>
            <span className="text-xs text-muted-foreground">/ {stats.totalSessions} started</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Average Overall Score
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                stats.averageScore >= 75
                  ? "text-emerald-500"
                  : stats.averageScore >= 60
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {stats.averageScore}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Readiness Boost
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary">
              +{stats.completedSessions * 50} XP
            </span>
            <span className="text-xs text-muted-foreground">accumulated</span>
          </div>
        </div>
      </div>

      {/* Improvement Trend Chart (Recharts) */}
      {trend.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">
                Historical Performance Trajectory
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {trend.length} evaluated session{trend.length > 1 ? "s" : ""}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Track your score trajectory across Technical, Clarity, and STAR Structure metrics as you practice.
          </p>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  name="Overall Score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="structureScore"
                  name="STAR Structure (x10)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="clarityScore"
                  name="Clarity (x10)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session Records Table / Cards */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-base text-foreground">Past Interview Sessions</h3>
          </div>
          {onStartNew && (
            <button
              onClick={onStartNew}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-primary-foreground" />
              <span>Practice New Session</span>
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-muted/20 border border-border space-y-3">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <h4 className="text-sm font-bold text-foreground">No Practice Sessions Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Simulate your first mock interview or analyze a job description to start tracking your readiness progression.
            </p>
            {onStartNew && (
              <button
                onClick={onStartNew}
                className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-2"
              >
                <span>Launch Mock Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isCompleted = s.status === "COMPLETED";
              const score = s.feedback?.overallScore;

              return (
                <div
                  key={s.id}
                  onClick={() => isCompleted && handleReviewSession(s.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted
                      ? "bg-card border-border hover:border-primary/40 cursor-pointer hover:shadow-sm"
                      : "bg-muted/10 border-dashed border-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                        {s.type}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{s.title}</h4>
                    <span className="text-xs text-muted-foreground block">
                      {s.answeredTurnsCount} of {s.turnsCount} questions answered
                    </span>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {isCompleted && score !== undefined ? (
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block font-medium">
                          Score
                        </span>
                        <span
                          className={`text-lg font-extrabold ${
                            score >= 80
                              ? "text-emerald-500"
                              : score >= 65
                              ? "text-primary"
                              : "text-amber-500"
                          }`}
                        >
                          {Math.round(score)}/100
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        In Progress
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <button
                          onClick={() => handleReviewSession(s.id)}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        title="Delete Session"
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
