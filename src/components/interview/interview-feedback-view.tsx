"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";

export interface InterviewFeedbackData {
  overallScore: number;
  contentScore: number;
  clarityScore: number;
  structureScore: number;
  confidenceScore: number;
  deliveryScore?: number;
  fillerWordCount?: number;
  strengths: string[];
  improvements: string[];
  summary?: string;
  nextSteps?: string[];
}

export interface InterviewTurnData {
  id?: string;
  turnNumber: number;
  question: string;
  answer?: string | null;
  feedback?: {
    contentScore?: number;
    clarityScore?: number;
    structureScore?: number;
    confidenceScore?: number;
    feedback?: string;
    strengths?: string[];
    improvements?: string[];
    suggestedAnswer?: string;
    followUp?: string;
    fillerWordsDetected?: number;
  } | null;
}

interface InterviewFeedbackViewProps {
  sessionTitle: string;
  sessionType: string;
  feedback: InterviewFeedbackData;
  turns?: InterviewTurnData[];
  onRestart?: () => void;
  onViewHistory?: () => void;
}

export default function InterviewFeedbackView({
  sessionTitle,
  sessionType,
  feedback,
  turns = [],
  onRestart,
  onViewHistory,
}: InterviewFeedbackViewProps) {
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 65) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 85) return { label: "Strong Hire / Ready for Onsite", color: "text-emerald-500" };
    if (score >= 70) return { label: "Competitive Candidate", color: "text-primary" };
    if (score >= 55) return { label: "Promising with Minor Gaps", color: "text-amber-500" };
    return { label: "Needs Practice & Structure", color: "text-rose-500" };
  };

  const grade = getScoreGrade(feedback.overallScore);

  const dimensionMetrics = [
    { label: "Technical Content Depth", score: feedback.contentScore, max: 10, desc: "Technical accuracy, depth, and domain terminology" },
    { label: "Communication Clarity", score: feedback.clarityScore, max: 10, desc: "Logical narrative flow, conciseness, avoiding rambling" },
    { label: "STAR Structure", score: feedback.structureScore, max: 10, desc: "Situation, Task, Action, and measurable Result" },
    { label: "Confidence & Poise", score: feedback.confidenceScore, max: 10, desc: "Conviction, assertiveness, and composed delivery" },
    { label: "Delivery & Pacing", score: feedback.deliveryScore ?? 8, max: 10, desc: "Natural conversational rhythm and listening ability" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Score Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                {sessionType} Simulation Complete
              </span>
              <span className="text-xs text-muted-foreground">• Scored with Gemini</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {sessionTitle}
            </h2>
            <p className={`text-sm font-semibold ${grade.color}`}>
              {grade.label}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border">
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-medium block">Overall Score</span>
              <span className={`text-4xl font-extrabold tracking-tight ${grade.color}`}>
                {Math.round(feedback.overallScore)}
              </span>
              <span className="text-[11px] text-muted-foreground block">/ 100</span>
            </div>
            <div className="w-px h-12 bg-border mx-1" />
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-medium block">Fillers Detected</span>
              <span className="text-2xl font-bold text-foreground">
                {feedback.fillerWordCount ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground block">words across turns</span>
            </div>
          </div>
        </div>

        {feedback.summary && (
          <div className="mt-6 p-4 rounded-2xl bg-muted/30 border border-border text-xs md:text-sm text-foreground/90 leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p>{feedback.summary}</p>
          </div>
        )}
      </div>

      {/* Grid: Dimension Scores + Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension Breakdown */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Evaluation Matrix</h3>
            </div>
            <span className="text-xs text-muted-foreground">Scored 0–10 scale</span>
          </div>

          <div className="space-y-4">
            {dimensionMetrics.map((dim, idx) => {
              const pct = Math.min(100, (dim.score / dim.max) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{dim.label}</span>
                    <span className="font-mono font-bold text-foreground">
                      {dim.score.toFixed(1)} / {dim.max}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 80 ? "bg-emerald-500" : pct >= 65 ? "bg-primary" : "bg-amber-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{dim.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths and Growth Areas */}
        <div className="space-y-6">
          {/* Strengths */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-base text-foreground">Demonstrated Strengths</h3>
            </div>
            <ul className="space-y-2">
              {feedback.strengths.map((s, idx) => (
                <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvement Areas */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-foreground">Priority Growth Areas</h3>
            </div>
            <ul className="space-y-2">
              {feedback.improvements.map((imp, idx) => (
                <li key={idx} className="text-xs text-foreground/90 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps Checklist */}
      {feedback.nextSteps && feedback.nextSteps.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-bold text-base text-foreground">Targeted Practice Plan</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete these recommended actions before your next live interview to boost your readiness score.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {feedback.nextSteps.map((step, idx) => (
              <label
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  checkedSteps[idx]
                    ? "bg-emerald-500/10 border-emerald-500/30 line-through text-muted-foreground"
                    : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedSteps[idx]}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="leading-snug">{step}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Question by Question Drilldown */}
      {turns.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-base text-foreground">Turn-by-Turn Responses & Evaluations</h3>
            </div>
            <span className="text-xs text-muted-foreground">{turns.length} questions answered</span>
          </div>

          <div className="space-y-3">
            {turns.map((t) => {
              const isExpanded = expandedTurn === t.turnNumber;
              const hasAnswer = !!t.answer;

              return (
                <div
                  key={t.turnNumber}
                  className="rounded-xl border border-border overflow-hidden bg-muted/20"
                >
                  <button
                    onClick={() => setExpandedTurn(isExpanded ? null : t.turnNumber)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        Q{t.turnNumber}
                      </span>
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {t.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {t.feedback?.contentScore !== undefined && (
                        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {t.feedback.contentScore}/10
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 space-y-3 border-t border-border bg-card text-xs">
                      <div>
                        <span className="font-semibold text-muted-foreground block text-[11px] mb-1">
                          Full Question:
                        </span>
                        <p className="text-foreground font-medium">{t.question}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-muted-foreground block text-[11px] mb-1">
                          Your Answer:
                        </span>
                        <div className="p-3 rounded-lg bg-muted/40 border border-border text-foreground/90 whitespace-pre-wrap">
                          {t.answer || "No response recorded."}
                        </div>
                      </div>

                      {t.feedback && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-primary text-[11px]">
                              AI Feedback & Insights:
                            </span>
                            {t.feedback.fillerWordsDetected !== undefined && (
                              <span className="text-[10px] text-muted-foreground">
                                Fillers: {t.feedback.fillerWordsDetected}
                              </span>
                            )}
                          </div>
                          <p className="text-foreground/90 bg-primary/5 p-3 rounded-lg border border-primary/15">
                            {t.feedback.feedback}
                          </p>

                          {t.feedback.suggestedAnswer && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border">
                              <span className="font-semibold text-secondary block text-[11px] mb-1">
                                Recommended Answer Outline:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {t.feedback.suggestedAnswer}
                              </p>
                            </div>
                          )}

                          {t.feedback.followUp && (
                            <div className="mt-2 p-2.5 rounded-lg bg-accent/30 border border-accent text-[11px] text-foreground flex items-start gap-2">
                              <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block">Interviewer Follow-up Probe:</span>
                                <span>{t.feedback.followUp}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            View Session History
          </button>
        )}
        {onRestart && (
          <button
            onClick={onRestart}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <span>Practice Another Interview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
