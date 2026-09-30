"use client";

import React from "react";
import {
  X,
  CheckCircle2,
  PlayCircle,
  Circle,
  Clock,
  ExternalLink,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface NodeDrawerResource {
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
}

export interface NodeDrawerData {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  category: string;
  level: number;
  estimatedHours: number;
  order?: number;
  dependsOn?: string[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: string | null;
  resources: NodeDrawerResource[];
}

interface NodeDrawerProps {
  node: NodeDrawerData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (nodeId: string, status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") => Promise<void>;
  isUpdating?: boolean;
}

export function NodeDrawer({
  node,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}: NodeDrawerProps) {
  if (!isOpen || !node) return null;

  const isCompleted = node.status === "COMPLETED";
  const isInProgress = node.status === "IN_PROGRESS";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-xl bg-card border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/20">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Phase {node.level} Milestone
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                {node.category.replace("_", " ")}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto sm:ml-0">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>{node.estimatedHours} hrs study</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground leading-tight">{node.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Action Card */}
          <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Completion Status
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Award className="w-3.5 h-3.5" /> +100 XP Earned
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(node.id, "NOT_STARTED")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  node.status === "NOT_STARTED"
                    ? "bg-muted text-foreground border-border shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>Not Started</span>
              </button>

              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(node.id, "IN_PROGRESS")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  isInProgress
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>In Progress</span>
              </button>

              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(node.id, "COMPLETED")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-emerald-500/10 hover:text-emerald-600"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </button>
            </div>
          </div>

          {/* Description & Syllabus */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Learning Objectives & Syllabus
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-2xl border border-border">
              {node.description}
            </p>
          </div>

          {/* Curated Resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Curated Learning Resources ({node.resources?.length || 0})
              </h3>
            </div>

            {node.resources && node.resources.length > 0 ? (
              <div className="space-y-2.5">
                {node.resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {res.provider}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {res.cost === "FREE" ? "Free" : res.price || "Paid"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {res.durationHours} hrs
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {res.title}
                      </h4>
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1 text-xs font-semibold shrink-0"
                    >
                      <span>Study</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                Check the Curated Learning Catalog tab for additional open courses and tutorials.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {isCompleted ? "Marked as completed" : "Step 1 of this track roadmap"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
