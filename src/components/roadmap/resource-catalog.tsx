"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  BookOpen,
  Sparkles,
  ExternalLink,
  Clock,
  DollarSign,
  GraduationCap,
  Award,
  CheckCircle2,
} from "lucide-react";

export interface ResourceItem {
  id: string;
  title: string;
  provider: string;
  url: string;
  type: string;
  cost: string;
  price?: string | null;
  durationHours: number;
  level: string;
  skills: string[];
  matchedGaps: string[];
  isGapMatch: boolean;
}

interface ResourceCatalogProps {
  trackSlug?: string;
  userGaps?: string[];
}

export function ResourceCatalog({ trackSlug, userGaps = [] }: ResourceCatalogProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gapOnly, setGapOnly] = useState(false);
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCost, setSelectedCost] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (trackSlug) params.append("trackSlug", trackSlug);
      if (gapOnly) params.append("gapOnly", "true");
      if (selectedType !== "ALL") params.append("type", selectedType);
      if (selectedCost !== "ALL") params.append("cost", selectedCost);
      if (selectedLevel !== "ALL") params.append("level", selectedLevel);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/roadmap/resources?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackSlug, gapOnly, selectedType, selectedCost, selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses, certifications, providers (e.g. Next.js, Docker, Coursera)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </form>

          {/* Gap Only Toggle Switch */}
          <button
            onClick={() => setGapOnly(!gapOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              gapOnly
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-2 ring-emerald-500/20"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target My Missing Skills ({userGaps.length})</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/60 text-xs">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 uppercase tracking-wider">
            Filters:
          </span>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            {["ALL", "COURSE", "CERTIFICATION", "BOOK"].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedType === type
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type === "ALL" ? "All Formats" : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Cost Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            {["ALL", "FREE", "PAID"].map((cost) => (
              <button
                key={cost}
                onClick={() => setSelectedCost(cost)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedCost === cost
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cost === "ALL" ? "Any Price" : cost === "FREE" ? "Free Only" : "Paid"}
              </button>
            ))}
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedLevel === lvl
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lvl === "ALL" ? "All Levels" : lvl.charAt(0) + lvl.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Filtering curated learning catalog...</p>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                item.isGapMatch
                  ? "bg-card border-emerald-500/40 hover:border-emerald-500 shadow-sm"
                  : "bg-card border-border hover:border-border/80"
              }`}
            >
              <div className="space-y-3">
                {/* Header Meta */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {item.provider}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.cost === "FREE"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.cost === "FREE" ? "Free" : item.price || "Paid"}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {item.level}
                    </span>
                  </div>
                </div>

                {/* Gap Match Callout */}
                {item.isGapMatch && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Closes gap in: {item.matchedGaps.join(", ")}</span>
                  </div>
                )}

                {/* Title */}
                <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                {/* Skills Covered Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.skills.map((skill) => {
                    const isMatchedGap = item.matchedGaps.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                          isMatchedGap
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                            : "bg-muted/50 text-muted-foreground border-border"
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.durationHours} hours</span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>Enroll</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border space-y-2">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="text-sm font-bold text-foreground">No matching learning resources found</h4>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search keywords or resetting active filters.
          </p>
        </div>
      )}
    </div>
  );
}
