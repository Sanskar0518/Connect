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
  JOB: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  APPRENTICESHIP: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  SCHEME: "bg-amber-500/15 text-amber-300 border-amber-500/30",
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
    days < 7 ? "bg-red-500/15 text-red-300 border-red-500/30"
    : days < 21 ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
    : "bg-white/5 text-white/50 border-white/10";
  return (
    <span className={"flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border " + urgency}>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search roles, departments, schemes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          >
            {STATES.map((s) => (
              <option key={s} value={s} className="bg-gray-900">{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-gray-900">
                {t === "All" ? "All Types" : t}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      <p className="text-xs text-white/40">
        {loading ? "Loading..." : opportunities.length + " opportunities found"}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No opportunities match your filters.</p>
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
                className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-white/20 hover:bg-white/[0.07] transition-all"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={"shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border " +
                        (TYPE_COLORS[opp.type] || "bg-white/5 text-white/40")}
                    >
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white leading-snug">{opp.title}</h3>
                      <p className="text-xs text-white/40 mt-0.5">{opp.department}</p>
                    </div>
                  </div>
                  <span
                    className={"shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border " +
                      (TYPE_COLORS[opp.type] || "bg-white/5 text-white/40")}
                  >
                    {opp.type}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
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

                <p className="text-xs text-cyan-400/80 font-medium">{opp.scheme}</p>

                <p className={"text-xs text-white/50 transition-all " + (isOpen ? "" : "line-clamp-2")}>
                  {opp.description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setExpanded(isOpen ? null : opp.id)}
                    className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
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
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 cursor-default"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30"
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all"
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
