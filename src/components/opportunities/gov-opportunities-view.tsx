"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search, MapPin, Briefcase, GraduationCap,
  ExternalLink, BookmarkPlus, BookmarkCheck,
  Filter, ChevronDown, Building2, Clock, Award,
} from "lucide-react";

interface GovOpp {
  id: string;
  title: string;
  department: string;
  scheme: string;
  state: string;
  qualification: string;
  deadline?: string | null;
  description: string;
  url: string;
  type: string;
  isSaved?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  JOB: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30",
  APPRENTICESHIP: "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/30",
  SCHEME: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  JOB: Briefcase,
  APPRENTICESHIP: Award,
  SCHEME: Building2,
};

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function DeadlineBadge({ deadline }: { deadline?: string | null }) {
  if (!deadline) return null;
  const days = daysUntil(deadline);
  const urgency =
    days < 7 ? "bg-rose-50 dark:bg-red-500/15 text-rose-700 dark:text-red-300 border-rose-300 dark:border-red-500/30"
    : days < 21 ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={"flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium " + urgency}>
      <Clock className="w-3 h-3" />
      {days <= 0 ? "Closed" : days === 1 ? "1 day left" : days + " days left"}
    </span>
  );
}

export default function GovOpportunitiesView() {
  const [opportunities, setOpportunities] = useState<GovOpp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedState !== "All") params.set("state", selectedState);
    if (selectedType !== "All") params.set("type", selectedType);
    try {
      const res = await fetch("/api/opportunities/gov?" + params.toString());
      const data = await res.json() as { opportunities: GovOpp[] };
      setOpportunities(data.opportunities || []);
      const init: Record<string, boolean> = {};
      (data.opportunities || []).forEach((o: GovOpp) => { init[o.id] = !!o.isSaved; });
      setSavedStatus((prev) => ({ ...prev, ...init }));
    } catch { setOpportunities([]); }
    setLoading(false);
  }, [search, selectedState, selectedType]);

  useEffect(() => {
    const t = setTimeout(fetchOpps, 300);
    return () => clearTimeout(t);
  }, [fetchOpps]);

  const handleSave = async (opp: GovOpp) => {
    if (savedStatus[opp.id]) return;
    setSaving(opp.id);
    try {
      const res = await fetch("/api/opportunities/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opp.title,
          organization: opp.department,
          sourceType: "GOV",
          sourceId: opp.id,
          deadline: opp.deadline,
          url: opp.url,
        }),
      });
      if (res.ok) setSavedStatus((prev) => ({ ...prev, [opp.id]: true }));
    } catch {}
    setSaving(null);
  };

  const STATES = [
    "All", "All India", "Karnataka", "Tamil Nadu", "Maharashtra",
    "Kerala", "Telangana", "Rajasthan", "Delhi", "Multiple States",
  ];
  const TYPES = ["All", "JOB", "APPRENTICESHIP", "SCHEME"];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search roles, departments, schemes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 transition-colors shadow-sm"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-cyan-500/50 transition-colors shadow-sm cursor-pointer"
          >
            {STATES.map((s) => (
              <option key={s} value={s} className="bg-background text-foreground">{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-cyan-500/50 transition-colors shadow-sm cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-background text-foreground">
                {t === "All" ? "All Types" : t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {loading ? "Loading..." : opportunities.length + " opportunities found"}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse shadow-sm" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-muted-foreground" />
          <p className="text-sm font-medium">No opportunities match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => {
            const TypeIcon = TYPE_ICONS[opp.type] || Briefcase;
            const isOpen = expanded === opp.id;
            const isSaved = savedStatus[opp.id] ?? opp.isSaved;
            return (
              <div
                key={opp.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-3 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={"shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border " +
                          (TYPE_COLORS[opp.type] || "bg-muted text-muted-foreground border-border")}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground leading-snug">{opp.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{opp.department}</p>
                      </div>
                    </div>
                    <span
                      className={"shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border " +
                        (TYPE_COLORS[opp.type] || "bg-muted text-muted-foreground border-border")}
                    >
                      {opp.type}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {opp.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {opp.qualification.substring(0, 40)}
                      {opp.qualification.length > 40 ? "..." : ""}
                    </span>
                    <DeadlineBadge deadline={opp.deadline} />
                  </div>

                  <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">{opp.scheme}</p>

                  <p className={"text-xs text-muted-foreground leading-relaxed transition-all " + (isOpen ? "" : "line-clamp-2")}>
                    {opp.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <button
                    onClick={() => setExpanded(isOpen ? null : opp.id)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                  >
                    {isOpen ? "Show less" : "Read more"}
                    <ChevronDown
                      className={"w-3 h-3 transition-transform " + (isOpen ? "rotate-180" : "")}
                    />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(opp)}
                      disabled={!!isSaved || saving === opp.id}
                      className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all " + (
                        isSaved
                          ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 cursor-default"
                          : "bg-muted text-foreground border-border hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-500/30"
                      )}
                    >
                      {isSaved ? (
                        <><BookmarkCheck className="w-3.5 h-3.5" /> Saved</>
                      ) : saving === opp.id ? (
                        <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Saving...</>
                      ) : (
                        <><BookmarkPlus className="w-3.5 h-3.5" /> Save to Tracker</>
                      )}
                    </button>
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm transition-all"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
