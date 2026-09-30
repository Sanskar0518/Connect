"use client";

import { useState, useCallback, useEffect } from "react";
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
  Database,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Layers,
  Code2,
} from "lucide-react";
import { ResumeScreeningData } from "@/lib/ai/schemas/resume";

interface ResumeRewrite {
  section: string;
  before: string;
  after: string;
  reason: string;
}

interface ResumeAnalysisData {
  id?: string;
  atsScore: number;
  matchLevel?: string;
  keywords: string[];
  missingKeywords: string[];
  issues: string[];
  rewrites: ResumeRewrite[];
  summary: string;
  strengthAreas: string[];
  improvementPriorities: string[];
}

interface SupabaseStorageInfo {
  fileUrl: string | null;
  jsonReportUrl: string | null;
  bucket: string;
  storedInSupabase: boolean;
}

export default function ResumeOptimizer() {
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("resume.pdf");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [targetCompany, setTargetCompany] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysisData | null>(null);
  const [screening, setScreening] = useState<ResumeScreeningData | null>(null);
  const [supabaseData, setSupabaseData] = useState<SupabaseStorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [expandedRewrites, setExpandedRewrites] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<
    "overview" | "candidate" | "rewrites" | "keywords" | "supabase"
  >("overview");

  // Fetch latest analysis on mount
  useEffect(() => {
    async function loadLatest() {
      try {
        const res = await fetch("/api/resume/analyze");
        if (res.ok) {
          const data = await res.json();
          if (data.analysis) setAnalysis(data.analysis);
          if (data.screening) setScreening(data.screening);
          if (data.resume?.fileUrl) {
            setSupabaseData({
              fileUrl: data.resume.fileUrl,
              jsonReportUrl: null,
              bucket: "connect-storage",
              storedInSupabase: true,
            });
            setFileName(data.resume.fileName || "resume.pdf");
          }
        }
      } catch (err) {
        console.warn("Could not load latest resume:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadLatest();
  }, []);

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    setError(null);

    // If it's plain text, we can also preview the text
    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setResumeText((ev.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileChange(droppedFile);
      }
    },
    [handleFileChange]
  );

  const handleAnalyze = async () => {
    if (uploadMode === "file" && !selectedFile && !resumeText.trim()) {
      setError("Please select a resume file (PDF, DOCX, or TXT) to upload.");
      return;
    }
    if (uploadMode === "text" && !resumeText.trim()) {
      setError("Please paste your resume text to begin screening.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (uploadMode === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("resumeText", resumeText);
      }
      formData.append("fileName", selectedFile?.name || fileName || "resume.txt");
      formData.append("targetRole", targetRole);
      formData.append("targetCompany", targetCompany);

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setScreening(data.screening);
      setSupabaseData(data.supabase);
      setActiveTab("overview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during screening.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!screening) return;
    navigator.clipboard.writeText(JSON.stringify(screening, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const score = screening?.atsScreening.atsScore ?? analysis?.atsScore ?? 0;
  const matchLevel = screening?.atsScreening.matchLevel ?? analysis?.matchLevel ?? "Moderate Match";

  const scoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-400";
    if (s >= 65) return "text-cyan-400";
    if (s >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const scoreBadgeColor = (s: number) => {
    if (s >= 80) return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    if (s >= 65) return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
    if (s >= 50) return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    return "bg-rose-500/15 border-rose-500/30 text-rose-300";
  };

  const scoreGradient = (s: number) => {
    if (s >= 80) return "from-emerald-500 via-teal-500 to-cyan-500";
    if (s >= 65) return "from-cyan-500 via-blue-500 to-indigo-500";
    if (s >= 50) return "from-amber-500 via-orange-500 to-rose-500";
    return "from-rose-500 to-red-600";
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
      {/* Upload and Control Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-xl tracking-tight">
                  Gemini Resume Screening & Extractor
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini 3.1
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Supabase Storage
                </span>
              </div>
              <p className="text-white/60 text-sm mt-0.5">
                Screen candidate resumes, extract entities, compute ATS compatibility, and store records directly in Supabase.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setUploadMode("file")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                uploadMode === "file"
                  ? "bg-violet-600 text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Upload PDF / DOCX
            </button>
            <button
              onClick={() => setUploadMode("text")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                uploadMode === "text"
                  ? "bg-violet-600 text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Paste Resume Text
            </button>
          </div>
        </div>

        {/* Input Parameters: Target Role & Target Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Target Job Title / Role
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm transition-all"
              placeholder="e.g. Full-Stack Engineer, Machine Learning Specialist"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wider">
              Target Company (Optional)
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm transition-all"
              placeholder="e.g. Google, Microsoft, Stripe, YC Startup"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
            />
          </div>
        </div>

        {/* Upload Drop Zone or Text Area */}
        {uploadMode === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative ${
              isDragging
                ? "border-violet-500 bg-violet-500/10"
                : selectedFile
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-white/15 bg-white/[0.02] hover:border-violet-500/50 hover:bg-white/[0.04]"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedFile
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-violet-500/10 text-violet-400"
                }`}
              >
                {selectedFile ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-white font-semibold text-base">{selectedFile.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready for Gemini extraction & Supabase storage
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-white font-medium text-sm">
                    Drag and drop your resume file here, or{" "}
                    <span className="text-violet-400 underline underline-offset-2">browse files</span>
                  </p>
                  <p className="text-white/40 text-xs mt-1">Supports PDF (.pdf), Word (.docx), and Text (.txt) up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/70 uppercase tracking-wider">
              Paste Resume Plaintext
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-500 text-sm font-mono resize-none leading-relaxed"
              rows={8}
              placeholder="Paste candidate work experience, education, skills, and summary here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <p className="text-white/30 text-xs text-right">{resumeText.length} characters</p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 text-base"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Scanning with Gemini & Storing in Supabase…</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Extract & Screen Resume</span>
            </>
          )}
        </button>
      </div>

      {/* Supabase Storage Sync Banner */}
      {supabaseData && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  Persisted in Supabase Storage
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300">
                  {supabaseData.bucket}
                </span>
              </div>
              <p className="text-white/60 text-xs mt-0.5">
                File and structured Gemini JSON report are safely stored in your Supabase bucket.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {supabaseData.fileUrl && (
              <a
                href={supabaseData.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>View Stored File</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {supabaseData.jsonReportUrl && (
              <a
                href={supabaseData.jsonReportUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Supabase JSON</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Screening & Extraction Results */}
      {(screening || analysis) && (
        <div className="space-y-4">
          {/* ATS Score Hero Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="space-y-2 max-w-lg">
                <div className="flex items-center gap-2.5">
                  <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">
                    ATS Compatibility
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold border ${scoreBadgeColor(
                      score
                    )}`}
                  >
                    {matchLevel}
                  </span>
                </div>
                <div className={`text-6xl font-black tracking-tight ${scoreColor(score)}`}>
                  {score}
                  <span className="text-2xl text-white/30 font-medium">/100</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  {screening?.atsScreening.summary ?? analysis?.summary}
                </p>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                    className={`stroke-current ${scoreColor(score)} transition-all duration-1000`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black ${scoreColor(score)}`}>{score}%</span>
                  <span className="text-[10px] text-white/40 uppercase font-semibold">Match</span>
                </div>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${scoreGradient(
                  score
                )} rounded-full transition-all duration-1000`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "overview", label: "Overview & ATS" },
              { id: "candidate", label: "Candidate Extracted Profile" },
              { id: "rewrites", label: `Bullet Rewrites (${analysis?.rewrites.length ?? 0})` },
              { id: "keywords", label: "Role Keywords" },
              { id: "supabase", label: "Supabase & JSON Data" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-emerald-400 text-sm uppercase tracking-wider">
                  <Star className="w-4 h-4" /> Key Strengths
                </h3>
                <ul className="space-y-2">
                  {(screening?.atsScreening.strengths ?? analysis?.strengthAreas ?? []).map(
                    (s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Priority Gaps */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                <h3 className="flex items-center gap-2 font-bold text-amber-400 text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Priority Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {(
                    screening?.atsScreening.criticalGaps ??
                    analysis?.improvementPriorities ??
                    []
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Roles */}
              {screening?.atsScreening.recommendedRoles &&
                screening.atsScreening.recommendedRoles.length > 0 && (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 md:col-span-2 space-y-2.5">
                    <h3 className="font-bold text-violet-300 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Top Recommended Roles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {screening.atsScreening.recommendedRoles.map((roleName, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-200 text-xs font-semibold"
                        >
                          {roleName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* TAB 2: CANDIDATE EXTRACTED PROFILE */}
          {activeTab === "candidate" && (
            <div className="space-y-4">
              {/* Candidate Info Card */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {screening?.candidate.name || "Candidate Name"}
                      </h3>
                      <p className="text-white/60 text-xs">
                        {[
                          screening?.candidate.email,
                          screening?.candidate.phone,
                          screening?.candidate.location,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Contact info extracted"}
                      </p>
                    </div>
                  </div>
                  {/* Links */}
                  <div className="flex items-center gap-2">
                    {screening?.candidate.links?.github && (
                      <a
                        href={screening.candidate.links.github}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {screening?.candidate.links?.linkedin && (
                      <a
                        href={screening.candidate.links.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium flex items-center gap-1.5"
                      >
                        LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {screening?.candidate.links?.portfolio && (
                      <a
                        href={screening.candidate.links.portfolio}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium flex items-center gap-1.5"
                      >
                        Portfolio <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {screening?.candidate.summary && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-1">
                      Professional Summary
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {screening.candidate.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Categorized Skills */}
              {screening?.skills && (
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-violet-400" /> Extracted Skills Inventory
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Technical */}
                    {screening.skills.technical.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-white/50 font-medium">Programming Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {screening.skills.technical.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Frontend */}
                    {screening.skills.frontend.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-white/50 font-medium">Frontend & UI</p>
                        <div className="flex flex-wrap gap-1.5">
                          {screening.skills.frontend.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Backend */}
                    {screening.skills.backend.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-white/50 font-medium">Backend & APIs</p>
                        <div className="flex flex-wrap gap-1.5">
                          {screening.skills.backend.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Databases & Cloud */}
                    {screening.skills.databasesAndCloud.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-white/50 font-medium">Databases & Cloud</p>
                        <div className="flex flex-wrap gap-1.5">
                          {screening.skills.databasesAndCloud.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {screening?.experience && screening.experience.length > 0 && (
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-violet-400" /> Extracted Work Experience
                  </h3>
                  <div className="space-y-4">
                    {screening.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-violet-500/40 pl-4 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-white font-semibold text-sm">{exp.role}</p>
                          {exp.period && (
                            <span className="text-xs text-white/40 font-mono">{exp.period}</span>
                          )}
                        </div>
                        <p className="text-violet-300 text-xs font-medium">{exp.company}</p>
                        {exp.highlights.length > 0 && (
                          <ul className="list-disc list-inside text-white/70 text-xs space-y-1 pt-1">
                            {exp.highlights.map((h, hi) => (
                              <li key={hi}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {screening?.education && screening.education.length > 0 && (
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-violet-400" /> Extracted Education
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screening.education.map((edu, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-white font-semibold text-sm">{edu.degree}</p>
                        <p className="text-violet-300 text-xs mt-0.5">{edu.institution}</p>
                        <div className="flex items-center gap-3 text-xs text-white/50 mt-2 font-mono">
                          {edu.year && <span>{edu.year}</span>}
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REWRITES */}
          {activeTab === "rewrites" && (
            <div className="space-y-3">
              {(analysis?.rewrites ?? []).length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">
                  No bullet rewrites needed — resume bullet points are strong!
                </p>
              ) : (
                (analysis?.rewrites ?? []).map((rw, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleRewrite(i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-semibold">
                          {rw.section}
                        </span>
                        <span className="text-white/70 text-sm line-clamp-1">{rw.before}</span>
                      </div>
                      {expandedRewrites.has(i) ? (
                        <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                      )}
                    </button>
                    {expandedRewrites.has(i) && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                          <p className="text-xs text-rose-400 font-bold mb-1 uppercase tracking-wider">
                            Before (Original Bullet)
                          </p>
                          <p className="text-sm text-white/70">{rw.before}</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">
                            After (Action-Verb + Impact Rewrite)
                          </p>
                          <p className="text-sm text-white font-medium">{rw.after}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                          <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">
                            Recruiter & ATS Impact
                          </p>
                          <p className="text-sm text-white/70">{rw.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: KEYWORDS */}
          {activeTab === "keywords" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Matching Keywords Found
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    {analysis?.keywords.length ?? 0}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis?.keywords ?? []).map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-full text-xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Missing Target Keywords
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    {analysis?.missingKeywords.length ?? 0}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analysis?.missingKeywords ?? []).map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-300 rounded-full text-xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUPABASE & JSON DATA */}
          {activeTab === "supabase" && (
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Supabase Storage & Structured JSON</h3>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              {supabaseData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 mb-1">Resume File in Supabase</p>
                    <p className="text-emerald-400 font-mono break-all">{supabaseData.fileUrl || "Not yet uploaded"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 mb-1">JSON Screening Report in Supabase</p>
                    <p className="text-cyan-400 font-mono break-all">{supabaseData.jsonReportUrl || "Saved in bucket"}</p>
                  </div>
                </div>
              )}

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-xs text-white/80 leading-relaxed">
                <pre>{JSON.stringify(screening ?? analysis, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
