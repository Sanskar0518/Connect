"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Clock,
  CheckCircle,
  Plus,
  ExternalLink,
  Loader2,
  Award,
  Sparkles,
  Check,
  Send,
} from "lucide-react";

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  isExpired: boolean;
  submissionsCount: number;
  userSubmission: {
    id: string;
    status: string;
    proofUrl: string | null;
    notes: string | null;
    submittedAt: string;
  } | null;
}

export function ChallengesView() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal / Accordion State
  const [activeSubmitId, setActiveSubmitId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Create Challenge Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Web Development");
  const [newXp, setNewXp] = useState(150);
  const [newDays, setNewDays] = useState(7);
  const [creating, setCreating] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/community/challenges");
      const data = await res.json();
      if (res.ok) {
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error("Failed to load challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSubmitSolution = async (challengeId: string) => {
    if (!proofUrl.trim() && !notes.trim()) {
      alert("Please provide either a solution URL or notes describing your work.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/community/challenges/${challengeId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofUrl: proofUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === challengeId
              ? {
                  ...c,
                  submissionsCount: c.submissionsCount + 1,
                  userSubmission: {
                    id: data.submission.id,
                    status: data.submission.status,
                    proofUrl: data.submission.proofUrl,
                    notes: data.submission.notes,
                    submittedAt: new Date().toISOString(),
                  },
                }
              : c
          )
        );
        setActiveSubmitId(null);
        setProofUrl("");
        setNotes("");
        alert(`🎉 Challenge completed! +${data.xpAwarded} XP awarded!`);
      } else {
        alert(data.error || "Failed to submit challenge");
      }
    } catch (err) {
      console.error("Challenge submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || creating) return;

    try {
      setCreating(true);
      const res = await fetch("/api/community/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          category: newCategory,
          xpReward: newXp,
          daysValid: newDays,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
        fetchChallenges();
      } else {
        alert(data.error || "Failed to create challenge");
      }
    } catch (err) {
      console.error("Challenge creation error:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Propose Challenge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border">
        <div>
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <span>Peer Skill Sprints & Challenges</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tackle weekly engineering and behavioral challenges to earn XP, level up your rank, and unlock verified portfolio badges.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>Propose Challenge (+30 XP)</span>
        </button>
      </div>

      {/* Challenge Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading active challenges...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const hasSubmitted = !!c.userSubmission;

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl bg-card border space-y-4 flex flex-col justify-between transition-all ${
                  hasSubmitted ? "border-secondary/40 bg-secondary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {c.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        +{c.xpReward} XP
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {c.daysRemaining > 0 ? `${c.daysRemaining}d left` : "Expired"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>

                {/* Submissions & Action */}
                <div className="pt-3 border-t border-border/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {c.submissionsCount} peer{c.submissionsCount === 1 ? "" : "s"} submitted
                    </span>

                    {hasSubmitted ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-secondary text-xs">
                        <CheckCircle className="w-4 h-4 fill-secondary text-card" />
                        <span>Completed (Verified)</span>
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setActiveSubmitId(activeSubmitId === c.id ? null : c.id)
                        }
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs transition-all shadow-sm"
                      >
                        {activeSubmitId === c.id ? "Cancel" : "Submit Solution"}
                      </button>
                    )}
                  </div>

                  {/* Already Submitted Summary */}
                  {hasSubmitted && c.userSubmission?.proofUrl && (
                    <div className="p-2.5 rounded-xl bg-card border border-border text-[11px] flex items-center justify-between">
                      <span className="text-muted-foreground truncate max-w-[200px]">
                        Proof: {c.userSubmission.proofUrl}
                      </span>
                      <a
                        href={c.userSubmission.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-0.5 ml-2 font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Submission Form Expander */}
                  {activeSubmitId === c.id && !hasSubmitted && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                      <h4 className="font-bold text-xs text-foreground">
                        Submit Solution for Verification
                      </h4>
                      <input
                        type="url"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        placeholder="Solution URL (GitHub repo, live demo, PR, or Loom)..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Briefly describe your approach, architecture decisions, and results..."
                        rows={2}
                        className="w-full p-2 text-xs rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleSubmitSolution(c.id)}
                        disabled={submitting}
                        className="w-full py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        {submitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Confirm Submission (+{c.xpReward} XP)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Propose a Peer Challenge</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket Chat in Next.js"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="System Design">System Design</option>
                  <option value="Data & Backend">Data & Backend</option>
                  <option value="Behavioral & Soft Skills">Behavioral & Soft Skills</option>
                  <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description & Requirements
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explain the criteria, constraints, and submission expectations..."
                  rows={3}
                  required
                  className="w-full p-2 text-xs rounded-lg bg-muted/40 border border-border text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    value={newXp}
                    onChange={(e) => setNewXp(Number(e.target.value))}
                    min={50}
                    max={500}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={newDays}
                    onChange={(e) => setNewDays(Number(e.target.value))}
                    min={3}
                    max={30}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold text-xs flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Publish Challenge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
