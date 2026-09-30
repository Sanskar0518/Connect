"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Sparkles,
  Target,
  BarChart3,
  Pencil,
  Check,
  X,
  Github,
  Linkedin,
  Globe,
  Loader2,
  RefreshCw,
  Building2,
  GraduationCap,
  BookOpen,
  FolderGit2,
} from "lucide-react";
import { AIBadge } from "@/components/common/ai-badge";
import { UploadDropzone } from "@/components/common/upload-dropzone";
import { GapAnalysisPanel } from "@/components/common/gap-analysis-panel";
import { SkillRadarChart, type RadarDataPoint } from "@/components/charts/skill-radar-chart";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Skill {
  id: string;
  skill: { name: string; category: string };
  confidence: number;
  source: string;
}
interface Course {
  id: string;
  name: string;
  code?: string | null;
  grade?: string | null;
  credits?: number | null;
  term?: string | null;
}
interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string; // JSON string
  url?: string | null;
  role?: string | null;
}
interface Profile {
  targetRole?: string | null;
  headline?: string | null;
  bio?: string | null;
  college?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  gpa?: number | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  readinessScore: number;
  skills: Skill[];
  courses: Course[];
  projects: Project[];
}
interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  logoUrl?: string | null;
}
interface GapData {
  targetRole: string;
  readinessPct: number;
  matchedSkills: { skill: string; confidence: number }[];
  missingSkills: { skill: string; severity: "Critical" | "Important" | "Nice-to-have"; reason: string }[];
  summary: string;
  source?: string;
}
interface ApiPayload {
  profile: Profile | null;
  latestGap: { targetRole: string; matchedSkills: string; missingSkills: string; readinessPct: number } | null;
  companies: Company[];
}

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────

type Tab = "talent" | "gap" | "radar";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "talent", label: "Talent Profile (F1)", icon: <UserCheck className="w-3.5 h-3.5" /> },
  { id: "gap", label: "Skill Gap Analysis (F2)", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "radar", label: "Company Radar (F13)", icon: <Sparkles className="w-3.5 h-3.5" /> },
];

// ─────────────────────────────────────────────
// Inline editable field
// ─────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  type = "text",
}: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex justify-between items-center py-1.5 border-b border-border group">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{value || "—"}</span>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type={type}
          className="text-xs border border-primary/50 rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        />
        {saving ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <>
            <button onClick={commit} className="p-1 rounded hover:bg-secondary/20 text-secondary">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

export default function ProfileClient() {
  const [activeTab, setActiveTab] = useState<Tab>("talent");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gapLoading, setGapLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [targetRole, setTargetRole] = useState("Full Stack Web Developer");
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");

  // ── Load profile data ──
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const data: ApiPayload = await res.json();
      setProfile(data.profile);
      setCompanies(data.companies || []);
      if (data.profile?.targetRole) setTargetRole(data.profile.targetRole);

      // Restore latest gap
      if (data.latestGap) {
        const g = data.latestGap;
        setGapData({
          targetRole: g.targetRole,
          readinessPct: g.readinessPct,
          matchedSkills: JSON.parse(g.matchedSkills || "[]"),
          missingSkills: JSON.parse(g.missingSkills || "[]"),
          summary: "",
          source: "cached",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Patch profile ──
  const patchProfile = async (field: string, value: string | number) => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    await loadProfile();
  };

  // ── Run gap analysis ──
  const runGapAnalysis = async () => {
    setGapLoading(true);
    try {
      const res = await fetch("/api/profile/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, companyId: selectedCompanyId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setGapData(data);
        // Build radar data from matched + missing
        buildRadarData(data);
      }
    } finally {
      setGapLoading(false);
    }
  };

  // ── Build radar data from gap result ──
  const buildRadarData = (gap: GapData) => {
    const profileSkillMap: Record<string, number> = {};
    (profile?.skills || []).forEach((ps) => {
      profileSkillMap[ps.skill.name] = Math.round(ps.confidence * 100);
    });

    const points: RadarDataPoint[] = [];

    // Matched skills
    gap.matchedSkills.slice(0, 8).forEach((ms) => {
      points.push({
        skill: ms.skill,
        student: Math.round(ms.confidence * 100),
        benchmark: 80,
      });
    });

    // Missing critical skills
    gap.missingSkills
      .filter((g) => g.severity === "Critical")
      .slice(0, 4)
      .forEach((ms) => {
        points.push({
          skill: ms.skill,
          student: profileSkillMap[ms.skill] || 0,
          benchmark: 85,
        });
      });

    setRadarData(points.slice(0, 10));
  };

  // ── When company changes, update radar label ──
  useEffect(() => {
    if (selectedCompanyId) {
      const co = companies.find((c) => c.id === selectedCompanyId);
      setSelectedCompanyName(co?.name || "");
    } else {
      setSelectedCompanyName("");
    }
  }, [selectedCompanyId, companies]);

  // ── Upload success handler ──
  const handleUploadSuccess = () => {
    loadProfile();
  };

  // ─────────────────────────────────
  // Derived data
  // ─────────────────────────────────

  const technical = profile?.skills.filter((s) => s.skill.category === "TECHNICAL") || [];
  const soft = profile?.skills.filter((s) => s.skill.category === "SOFT") || [];
  const domain = profile?.skills.filter((s) => s.skill.category === "DOMAIN") || [];

  // ─────────────────────────────────
  // Render
  // ─────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Talent Profile &amp; Skill Intelligence
            </h1>
            <AIBadge confidence={0.92} label="AI Extraction" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Upload transcripts, identify skill gaps, and benchmark against top companies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Target className="w-3 h-3 inline mr-1" />
            {profile?.targetRole || targetRole}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────── TAB: TALENT PROFILE ─── */}
      {activeTab === "talent" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Upload */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
              <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Upload Transcript
              </h2>
              <UploadDropzone onSuccess={handleUploadSuccess} />
            </div>

            {/* Academic Info */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <h2 className="font-bold text-sm text-foreground mb-3">Academic Information</h2>
              <EditableField
                label="College"
                value={profile?.college || ""}
                onSave={(v) => patchProfile("college", v)}
              />
              <EditableField
                label="Degree"
                value={profile?.degree || ""}
                onSave={(v) => patchProfile("degree", v)}
              />
              <EditableField
                label="Graduation Year"
                value={profile?.graduationYear?.toString() || ""}
                onSave={(v) => patchProfile("graduationYear", parseInt(v, 10))}
                type="number"
              />
              <EditableField
                label="GPA"
                value={profile?.gpa?.toString() || ""}
                onSave={(v) => patchProfile("gpa", parseFloat(v))}
                type="number"
              />
              <EditableField
                label="Target Role"
                value={profile?.targetRole || targetRole}
                onSave={(v) => { setTargetRole(v); return patchProfile("targetRole", v); }}
              />
            </div>

            {/* Links */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h2 className="font-bold text-sm text-foreground mb-2">Links</h2>
              <div className="flex items-center gap-2 text-xs">
                <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <EditableField
                  label=""
                  value={profile?.githubUrl || ""}
                  onSave={(v) => patchProfile("githubUrl", v)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <EditableField
                  label=""
                  value={profile?.linkedinUrl || ""}
                  onSave={(v) => patchProfile("linkedinUrl", v)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <EditableField
                  label=""
                  value={profile?.portfolioUrl || ""}
                  onSave={(v) => patchProfile("portfolioUrl", v)}
                />
              </div>
            </div>
          </div>

          {/* Right columns */}
          <div className="lg:col-span-2 space-y-5">
            {/* Skills by category */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Identified Competencies
                </h2>
                <span className="text-xs text-muted-foreground">
                  {profile?.skills.length ?? 0} skills
                </span>
              </div>

              {(!profile?.skills || profile.skills.length === 0) && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Upload a transcript above to auto-extract your skills.
                </p>
              )}

              {[
                { label: "Technical", skills: technical, color: "bg-primary/20 text-primary border-primary/30" },
                { label: "Soft Skills", skills: soft, color: "bg-secondary/20 text-secondary border-secondary/30" },
                { label: "Domain", skills: domain, color: "bg-accent/20 text-accent border-accent/30" },
              ].map(({ label, skills, color }) =>
                skills.length > 0 ? (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((ps) => (
                        <div
                          key={ps.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${color}`}
                          title={`Confidence: ${Math.round(ps.confidence * 100)}% · Source: ${ps.source}`}
                        >
                          {ps.skill.name}
                          <span className="text-[10px] opacity-70 font-mono">
                            {Math.round(ps.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>

            {/* Courses */}
            {(profile?.courses?.length ?? 0) > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  Academic Courses ({profile!.courses.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="pb-2 font-semibold">Course</th>
                        <th className="pb-2 font-semibold">Code</th>
                        <th className="pb-2 font-semibold">Grade</th>
                        <th className="pb-2 font-semibold">Credits</th>
                        <th className="pb-2 font-semibold">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {profile!.courses.slice(0, 12).map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 font-medium text-foreground">{c.name}</td>
                          <td className="py-2 text-muted-foreground font-mono">{c.code || "—"}</td>
                          <td className="py-2">
                            {c.grade ? (
                              <span className={`font-semibold ${c.grade.startsWith("A") ? "text-secondary" : c.grade.startsWith("B") ? "text-primary" : "text-muted-foreground"}`}>
                                {c.grade}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-2 text-muted-foreground">{c.credits ?? "—"}</td>
                          <td className="py-2 text-muted-foreground">{c.term || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Projects */}
            {(profile?.projects?.length ?? 0) > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-primary" />
                  Projects ({profile!.projects.length})
                </h2>
                <div className="space-y-3">
                  {profile!.projects.slice(0, 6).map((proj) => {
                    const techs: string[] = (() => { try { return JSON.parse(proj.technologies); } catch { return []; } })();
                    return (
                      <div key={proj.id} className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">{proj.title}</span>
                          {proj.url && (
                            <a href={proj.url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline shrink-0">
                              View →
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{proj.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {techs.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────── TAB: GAP ANALYSIS ─── */}
      {activeTab === "gap" && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card border border-border rounded-2xl">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Target Role
              </label>
              <input
                type="text"
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Web Developer"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Target Company (optional)
              </label>
              <select
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Any / Generic benchmark</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={runGapAnalysis}
                disabled={gapLoading || !targetRole.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {gapLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {gapLoading ? "Analyzing…" : "Analyze Gaps"}
              </button>
            </div>
          </div>

          {gapData ? (
            <div className="p-5 rounded-2xl bg-card border border-border">
              <GapAnalysisPanel
                targetRole={gapData.targetRole}
                readinessPct={gapData.readinessPct}
                matchedSkills={gapData.matchedSkills}
                missingSkills={gapData.missingSkills}
                summary={gapData.summary}
                source={gapData.source}
              />
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Set your target role and click <strong>Analyze Gaps</strong> to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────── TAB: COMPANY RADAR ─── */}
      {activeTab === "radar" && (
        <div className="space-y-5">
          {/* Company selector */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card border border-border rounded-2xl items-end">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Compare Against
              </label>
              <select
                className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Generic benchmark</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name} — {co.industry}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { setActiveTab("gap"); setTimeout(runGapAnalysis, 100); }}
              disabled={gapLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {gapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          </div>

          {/* Company cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {companies.slice(0, 10).map((co) => (
              <button
                key={co.id}
                onClick={() => setSelectedCompanyId(co.id)}
                className={`p-3 rounded-xl border text-center space-y-1 transition-all text-xs font-semibold ${
                  selectedCompanyId === co.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto" />
                <span>{co.name}</span>
              </button>
            ))}
          </div>

          {/* Radar chart */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-sm text-foreground">
                  Skill Radar — You vs. {selectedCompanyName || "Benchmark"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Run a gap analysis first to populate the chart.
                </p>
              </div>
              <AIBadge confidence={0.9} label="AI Benchmarked" />
            </div>
            <SkillRadarChart
              data={radarData}
              companyName={selectedCompanyName || "Benchmark"}
            />
          </div>

          {/* Score legend */}
          {gapData && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Readiness", value: `${gapData.readinessPct}%`, color: "text-primary" },
                { label: "Matched Skills", value: gapData.matchedSkills.length, color: "text-secondary" },
                { label: "Critical Gaps", value: gapData.missingSkills.filter((g) => g.severity === "Critical").length, color: "text-destructive" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-card border border-border text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
