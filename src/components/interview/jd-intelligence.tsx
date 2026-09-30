"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Code2,
  HeartHandshake,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Loader2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { AIBadge } from "@/components/common/ai-badge";

interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  industry: string;
  culture: string | null;
  techStack: string[];
  benchmarks: Array<{
    role: string;
    minReadiness: number;
  }>;
}

interface PredictedQuestion {
  type: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL";
  question: string;
  whyAsked: string;
  hint: string;
}

interface IntelligenceData {
  role: string;
  company: string;
  techStack: string[];
  softSkills: string[];
  requiredExperience: string;
  keyThemes: string[];
  likelyQuestions: PredictedQuestion[];
  prepChecklist: string[];
}

interface JDIntelligenceProps {
  onLaunchMock?: (params: {
    role: string;
    company: string;
    companyId?: string;
    type?: "TECHNICAL" | "BEHAVIORAL" | "MIXED";
    questions: PredictedQuestion[];
    jdText?: string;
  }) => void;
}

const DEMO_JD = `Role: Senior Full Stack Engineer (FinTech Platform)
Company: Stripe
Location: Remote / Bengaluru / San Francisco
Overview:
We are looking for a Full Stack Engineer to build reliable, high-throughput payment rails and developer dashboards. You will build user-facing financial tooling in TypeScript and React while designing distributed backends in Node.js, Go, and PostgreSQL.

Requirements:
- 2+ years software engineering experience in modern full-stack web architectures.
- Proficiency in TypeScript, React, REST / GraphQL APIs, and SQL (PostgreSQL).
- Experience with microservices, asynchronous message queues (Kafka / Redis), and Docker.
- Strong grounding in system design, distributed consistency, and failure mode mitigation.
- Customer-centric mindset with ownership and high empathy for developers.`;

export default function JDIntelligence({ onLaunchMock }: JDIntelligenceProps) {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Full Stack Developer");
  const [jdText, setJdText] = useState<string>(DEMO_JD);
  const [loading, setLoading] = useState<boolean>(false);
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL">("ALL");
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [checkedList, setCheckedList] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/interview/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data.companies || []);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    }
    loadCompanies();
  }, []);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (!companyId) return;

    const comp = companies.find((c) => c.id === companyId);
    if (comp) {
      if (comp.benchmarks.length > 0) {
        setTargetRole(comp.benchmarks[0].role);
      }
      setJdText(
        `Target Employer: ${comp.name} (${comp.industry})\nCulture & Values: ${comp.culture || "High engineering excellence and ownership."}\nCore Technology Stack: ${comp.techStack.join(", ")}\nRole: ${comp.benchmarks[0]?.role || targetRole}\nTarget candidate must demonstrate strong computer science fundamentals, system design depth, and proactive collaboration.`
      );
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim() && !selectedCompanyId) {
      setError("Please provide a job description or select a target employer.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interview/analyze-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jdText,
          targetRole,
          companyId: selectedCompanyId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze job description");
      }

      const data = await res.json();
      setIntelligence(data.intelligence);
      setCheckedList({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error analyzing JD");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedList((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredQuestions = intelligence?.likelyQuestions.filter((q) => {
    if (activeTab === "ALL") return true;
    return q.type === activeTab;
  }) || [];

  const handleLaunchPractice = () => {
    if (!intelligence || !onLaunchMock) return;

    onLaunchMock({
      role: intelligence.role || targetRole,
      company: intelligence.company || "Target Company",
      companyId: selectedCompanyId || undefined,
      type: "MIXED",
      questions: intelligence.likelyQuestions,
      jdText,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Input Form */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Company & JD Interview Intelligence (F10)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a seeded target company or paste any job description to extract tech stack signals, culture values, and predicted questions.
            </p>
          </div>

          <button
            onClick={() => {
              setJdText(DEMO_JD);
              setSelectedCompanyId("");
              setTargetRole("Senior Full Stack Engineer");
            }}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Demo JD</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Select Target Company (Seeded Benchmarks)
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Custom / Paste Any JD --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Backend Lead"
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Job Description / Requirements Text
          </label>
          <textarea
            rows={5}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste raw JD, requirements, or employer details..."
            className="w-full p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Intelligence with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract Intelligence & Predict Questions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {intelligence && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Summary & Launch Mock CTA */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/10 border border-border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
                  {intelligence.company}
                </span>
                <span className="text-xs text-muted-foreground">• Experience: {intelligence.requiredExperience}</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {intelligence.role} Intelligence Brief
              </h3>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Gemini synthesized {intelligence.likelyQuestions.length} predicted interview questions tailored to {intelligence.company}&apos;s tech stack and values.
              </p>
            </div>

            {onLaunchMock && (
              <button
                onClick={handleLaunchPractice}
                className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2.5 transition-all shadow-lg shadow-primary/20 shrink-0"
              >
                <Play className="w-4 h-4 fill-primary-foreground" />
                <span>Practice These in Mock Simulator</span>
              </button>
            )}
          </div>

          {/* Core Signals: Tech Stack, Culture, Themes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tech Stack */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Code2 className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Extracted Tech Stack
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {intelligence.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Cultural Signals */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-secondary">
                <HeartHandshake className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Culture & Soft Skills
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {intelligence.softSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Themes */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground">
                <Layers className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Employer Themes
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {intelligence.keyThemes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Predicted Questions Section */}
          <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">
                    Predicted Interview Questions ({intelligence.likelyQuestions.length})
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter by category. Click any hint to see model strategy before answering.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border self-start sm:self-auto">
                {(["ALL", "TECHNICAL", "BEHAVIORAL", "SITUATIONAL"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => {
                const isHintOpen = expandedHint === idx;
                const typeColor =
                  q.type === "TECHNICAL"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    : q.type === "BEHAVIORAL"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeColor}`}
                          >
                            {q.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {q.whyAsked}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm font-semibold text-foreground">
                          {q.question}
                        </p>
                      </div>

                      <button
                        onClick={() => setExpandedHint(isHintOpen ? null : idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-muted border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span>{isHintOpen ? "Hide Hint" : "Hint"}</span>
                        {isHintOpen ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {isHintOpen && (
                      <div className="p-3 rounded-xl bg-card border border-border text-xs text-foreground/90 space-y-1 animate-in fade-in">
                        <span className="font-semibold text-primary block text-[11px]">
                          How to Answer:
                        </span>
                        <p className="text-muted-foreground leading-relaxed">{q.hint}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Prep Checklist */}
          <div className="p-6 md:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-foreground">
                  Actionable Prep Checklist
                </h3>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {Object.values(checkedList).filter(Boolean).length} of{" "}
                {intelligence.prepChecklist.length} completed
              </span>
            </div>

            <div className="space-y-2">
              {intelligence.prepChecklist.map((item, idx) => {
                const isChecked = !!checkedList[idx];
                return (
                  <label
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/30 line-through text-muted-foreground"
                        : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span className="leading-snug">{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
