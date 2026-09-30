"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Upload,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ResumeRewrite {
  section: string;
  before: string;
  after: string;
  reason: string;
}

interface ResumeAnalysisData {
  atsScore: number;
  keywords: string[];
  missingKeywords: string[];
  issues: string[];
  rewrites: ResumeRewrite[];
  summary: string;
  strengthAreas: string[];
  improvementPriorities: string[];
}

export default function ResumeOptimizer() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("resume.txt");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRewrites, setExpandedRewrites] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "rewrites" | "keywords">("overview");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setResumeText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  }, []);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text or upload a file.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, fileName, targetRole, targetCompany }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const scoreGradient = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-500";
    if (score >= 60) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const toggleRewrite = (i: number) => {
    setExpandedRewrites((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-lg">AI Resume Optimizer</h2>
            <p className="text-white/50 text-sm">Get ATS score + AI-powered rewrites</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Target Role</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm"
              placeholder="e.g. Software Engineer Intern"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Target Company (optional)</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm"
              placeholder="e.g. Google, Amazon"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm text-white/60">Resume Text</label>
            <label className="cursor-pointer flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload .txt file
              <input type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm font-mono resize-none"
            rows={8}
            placeholder="Paste your resume text here, or upload a .txt file above..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
          <p className="text-white/30 text-xs mt-1">{resumeText.length} characters</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing with AI…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Analyze Resume
            </>
          )}
        </button>
      </div>

      {/* Results Panel */}
      {analysis && (
        <div className="space-y-4">
          {/* Score Hero */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/50 text-sm mb-1">ATS Compatibility Score</p>
                <div className={`text-6xl font-black ${scoreColor(analysis.atsScore)}`}>
                  {analysis.atsScore}
                  <span className="text-3xl text-white/40">/100</span>
                </div>
                <p className="text-white/60 text-sm mt-2 max-w-md">{analysis.summary}</p>
              </div>
              {/* Score Ring */}
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(analysis.atsScore / 100) * 251.2} 251.2`}
                    className={`stroke-current ${scoreColor(analysis.atsScore)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${scoreColor(analysis.atsScore)}`}>
                    {analysis.atsScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${scoreGradient(analysis.atsScore)} rounded-full transition-all duration-1000`}
                style={{ width: `${analysis.atsScore}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(["overview", "rewrites", "keywords"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <h3 className="flex items-center gap-2 font-semibold text-emerald-400 mb-3">
                  <Star className="w-4 h-4" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengthAreas.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <h3 className="flex items-center gap-2 font-semibold text-amber-400 mb-3">
                  <AlertTriangle className="w-4 h-4" /> Priority Improvements
                </h3>
                <ul className="space-y-2">
                  {analysis.improvementPriorities.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Issues */}
              {analysis.issues.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 md:col-span-2">
                  <h3 className="flex items-center gap-2 font-semibold text-red-400 mb-3">
                    <XCircle className="w-4 h-4" /> Issues Found
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Rewrites */}
          {activeTab === "rewrites" && (
            <div className="space-y-3">
              {analysis.rewrites.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No rewrites suggested — resume looks strong!</p>
              ) : (
                analysis.rewrites.map((rw, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleRewrite(i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium">
                          {rw.section}
                        </span>
                        <span className="text-white/60 text-sm line-clamp-1">{rw.before}</span>
                      </div>
                      {expandedRewrites.has(i) ? (
                        <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                      )}
                    </button>
                    {expandedRewrites.has(i) && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                        <div className="bg-red-500/10 rounded-xl p-3">
                          <p className="text-xs text-red-400 font-medium mb-1">BEFORE</p>
                          <p className="text-sm text-white/70">{rw.before}</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-3">
                          <p className="text-xs text-emerald-400 font-medium mb-1">AFTER</p>
                          <p className="text-sm text-white">{rw.after}</p>
                        </div>
                        <div className="bg-blue-500/10 rounded-xl p-3">
                          <p className="text-xs text-blue-400 font-medium mb-1">WHY THIS WORKS</p>
                          <p className="text-sm text-white/60">{rw.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Keywords */}
          {activeTab === "keywords" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Keywords Found
                  <span className="ml-auto text-sm text-white/40">{analysis.keywords.length}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-500/15 text-emerald-300 rounded-full text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Missing Keywords
                  <span className="ml-auto text-sm text-white/40">{analysis.missingKeywords.length}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/15 text-amber-300 rounded-full text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
