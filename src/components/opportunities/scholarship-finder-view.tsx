"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search, ExternalLink, BookmarkPlus, BookmarkCheck,
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  BadgeCheck, AlertCircle, HelpCircle, GraduationCap,
  DollarSign, Clock, Users,
} from "lucide-react";

interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline?: string | null;
  eligibilityCriteria: Record<string, unknown>;
  description: string;
  url: string;
  checklist: string[];
  eligibilityScore?: number;
  eligibilityBadge?: "Eligible" | "Likely Eligible" | "Review Criteria";
  completedItems?: string[];
  isSaved?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  Eligible: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Likely Eligible": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Review Criteria": "bg-red-500/15 text-red-300 border-red-500/30",
};

const BADGE_ICONS: Record<string, React.ElementType> = {
  Eligible: BadgeCheck,
  "Likely Eligible": AlertCircle,
  "Review Criteria": HelpCircle,
};

function formatCriteria(criteria: Record<string, unknown>): string[] {
  const tags: string[] = [];
  if (Array.isArray(criteria.degree))
    tags.push("Degree: " + (criteria.degree as string[]).join(" / "));
  if (typeof criteria.minGPA === "number")
    tags.push("Min GPA: " + criteria.minGPA);
  if (typeof criteria.maxFamilyIncomeINR === "number")
    tags.push("Income ≤ ₹" + Number(criteria.maxFamilyIncomeINR).toLocaleString("en-IN"));
  if (criteria.gender) tags.push("Gender: " + criteria.gender);
  if (typeof criteria.focus === "string") tags.push(criteria.focus as string);
  if (Array.isArray(criteria.year))
    tags.push("Year: " + (criteria.year as number[]).join(", "));
  if (criteria.minority) tags.push("Minority Community");
  return tags;
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/40">
        <span>{completed}/{total} steps done</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}

export default function ScholarshipFinderView() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [completedMap, setCompletedMap] = useState<Record<string, string[]>>({});
  const [togglingItem, setTogglingItem] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "saved">("all");

  const fetchScholarships = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    try {
      const res = await fetch("/api/opportunities/scholarships?" + params.toString());
      const data = await res.json() as { scholarships: Scholarship[] };
      setScholarships(data.scholarships || []);
      const saved: Record<string, boolean> = {};
      const completed: Record<string, string[]> = {};
      (data.scholarships || []).forEach((s: Scholarship) => {
        saved[s.id] = !!s.isSaved;
        completed[s.id] = s.completedItems || [];
      });
      setSavedStatus((prev) => ({ ...prev, ...saved }));
      setCompletedMap((prev) => ({ ...prev, ...completed }));
    } catch { setScholarships([]); }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchScholarships, 300);
    return () => clearTimeout(t);
  }, [fetchScholarships]);

  const handleSave = async (s: Scholarship) => {
    if (savedStatus[s.id]) return;
    setSaving(s.id);
    try {
      const res = await fetch("/api/opportunities/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: s.title,
          organization: s.provider,
          sourceType: "SCHOLARSHIP",
          sourceId: s.id,
          deadline: s.deadline,
          url: s.url,
        }),
      });
      if (res.ok) setSavedStatus((prev) => ({ ...prev, [s.id]: true }));
    } catch {}
    setSaving(null);
  };

  const toggleChecklistItem = async (scholarshipId: string, item: string) => {
    const key = scholarshipId + "-" + item;
    setTogglingItem(key);
    const current = completedMap[scholarshipId] || [];
    const isCompleted = current.includes(item);
    const optimistic = isCompleted
      ? current.filter((i) => i !== item)
      : [...current, item];
    setCompletedMap((prev) => ({ ...prev, [scholarshipId]: optimistic }));
    try {
      const res = await fetch("/api/opportunities/scholarships/" + scholarshipId + "/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, completed: !isCompleted }),
      });
      if (res.ok) {
        const data = await res.json() as { completedItems: string[] };
        setCompletedMap((prev) => ({ ...prev, [scholarshipId]: data.completedItems }));
      } else {
        setCompletedMap((prev) => ({ ...prev, [scholarshipId]: current }));
      }
    } catch {
      setCompletedMap((prev) => ({ ...prev, [scholarshipId]: current }));
    }
    setTogglingItem(null);
  };

  const filtered = scholarships.filter((s) => {
    if (filter === "eligible")
      return s.eligibilityBadge === "Eligible" || s.eligibilityBadge === "Likely Eligible";
    if (filter === "saved") return savedStatus[s.id];
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, provider, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(["all", "eligible", "saved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={"px-3.5 py-2.5 text-xs font-semibold capitalize transition-colors " + (
                filter === f ? "bg-cyan-500/20 text-cyan-300" : "text-white/40 hover:text-white/70 bg-white/5"
              )}
            >
              {f === "eligible" ? "Best Match" : f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/40">
        {loading ? "Loading..." : filtered.length + " scholarships found"}
      </p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No scholarships found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const badge = s.eligibilityBadge || "Review Criteria";
            const BadgeIcon = BADGE_ICONS[badge] || HelpCircle;
            const isOpen = expanded === s.id;
            const isSaved = savedStatus[s.id];
            const completedItems = completedMap[s.id] || [];
            const criteriaTagList = formatCriteria(s.eligibilityCriteria);
            const eligibilityScore = s.eligibilityScore ?? 50;
            const days = s.deadline ? daysUntil(s.deadline) : null;
            const circumference = 2 * Math.PI * 15;

            return (
              <div
                key={s.id}
                className="rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={"flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border " + (BADGE_STYLES[badge] || BADGE_STYLES["Review Criteria"])}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge}
                        </span>
                        {days !== null && days > 0 && (
                          <span className={"flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border " + (
                            days < 7 ? "bg-red-500/15 text-red-300 border-red-500/30"
                            : days < 21 ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-white/5 text-white/40 border-white/10"
                          )}>
                            <Clock className="w-3 h-3" />
                            {days} days left
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white leading-snug">{s.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {s.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {s.amount}
                        </span>
                      </div>
                    </div>
                    {/* Eligibility ring */}
                    <div className="shrink-0 relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={eligibilityScore >= 80 ? "#10b981" : eligibilityScore >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={(eligibilityScore / 100 * circumference).toFixed(2) + " " + circumference.toFixed(2)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {eligibilityScore}
                      </span>
                    </div>
                  </div>

                  {criteriaTagList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {criteriaTagList.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-white/50 line-clamp-2">{s.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="flex items-center gap-1 text-xs text-cyan-400/80 hover:text-cyan-300 transition-colors"
                    >
                      {isOpen ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> Hide checklist</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> View checklist ({s.checklist.length} steps)</>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(s)}
                        disabled={!!isSaved || saving === s.id}
                        className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all " + (
                          isSaved
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 cursor-default"
                            : "bg-white/5 text-white/60 border-white/10 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30"
                        )}
                      >
                        {isSaved ? (
                          <><BookmarkCheck className="w-3.5 h-3.5" /> Saved</>
                        ) : saving === s.id ? (
                          <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Saving...</>
                        ) : (
                          <><BookmarkPlus className="w-3.5 h-3.5" /> Save to Tracker</>
                        )}
                      </button>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all"
                      >
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Expandable checklist */}
                {isOpen && (
                  <div className="border-t border-white/10 p-5 space-y-3 bg-white/[0.03]">
                    <ProgressBar completed={completedItems.length} total={s.checklist.length} />
                    <ul className="space-y-2">
                      {s.checklist.map((item, idx) => {
                        const done = completedItems.includes(item);
                        const itemKey = s.id + "-" + item;
                        return (
                          <li key={idx}>
                            <button
                              onClick={() => toggleChecklistItem(s.id, item)}
                              disabled={togglingItem === itemKey}
                              className="w-full flex items-start gap-3 text-left hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                            >
                              <span className="shrink-0 mt-0.5">
                                {togglingItem === itemKey ? (
                                  <div className="w-4 h-4 border border-cyan-500/50 border-t-transparent rounded-full animate-spin" />
                                ) : done ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Circle className="w-4 h-4 text-white/20" />
                                )}
                              </span>
                              <span className={"text-xs leading-relaxed " + (done ? "text-white/30 line-through" : "text-white/70")}>
                                {item}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
