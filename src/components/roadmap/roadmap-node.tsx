"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  PlayCircle,
  Circle,
  Layers,
  Sparkles,
} from "lucide-react";

export interface RoadmapNodeData {
  id: string;
  title: string;
  description: string;
  category: "TECHNICAL" | "SYSTEM_DESIGN" | "PROJECT" | "SOFT_SKILL" | string;
  level: number;
  estimatedHours: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  resourcesCount: number;
  onSelectNode?: (nodeId: string) => void;
  onToggleStatus?: (nodeId: string, nextStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") => void;
}

export const CustomRoadmapNode = memo(({ data, selected }: NodeProps<RoadmapNodeData>) => {
  const {
    id,
    title,
    description,
    category,
    level,
    estimatedHours,
    status,
    resourcesCount,
    onSelectNode,
    onToggleStatus,
  } = data;

  const isCompleted = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";

  // Category styling
  const getCategoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "SYSTEM_DESIGN":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "PROJECT":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "SOFT_SKILL":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    }
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleStatus) return;

    if (status === "NOT_STARTED") {
      onToggleStatus(id, "IN_PROGRESS");
    } else if (status === "IN_PROGRESS") {
      onToggleStatus(id, "COMPLETED");
    } else {
      onToggleStatus(id, "NOT_STARTED");
    }
  };

  return (
    <div
      onClick={() => onSelectNode && onSelectNode(id)}
      className={`group relative w-[280px] rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        isCompleted
          ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-500"
          : isInProgress
          ? "bg-card border-primary ring-2 ring-primary/20 shadow-primary/5"
          : "bg-card border-border hover:border-border/80"
      } ${selected ? "ring-2 ring-primary border-primary shadow-lg" : ""}`}
    >
      {/* Target input handle from parent */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground/40 !border-2 !border-background group-hover:!bg-primary transition-colors"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(
            category
          )}`}
        >
          {category.replace("_", " ")}
        </span>

        <button
          onClick={handleStatusClick}
          title={
            isCompleted
              ? "Click to reset"
              : isInProgress
              ? "Click to mark completed (+100 XP)"
              : "Click to start"
          }
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all ${
            isCompleted
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
              : isInProgress
              ? "bg-primary/15 text-primary hover:bg-primary/25 animate-pulse"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Done</span>
            </>
          ) : isInProgress ? (
            <>
              <PlayCircle className="w-3.5 h-3.5 text-primary" />
              <span>Active</span>
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 text-muted-foreground" />
              <span>Start</span>
            </>
          )}
        </button>
      </div>

      {/* Title */}
      <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {title}
      </h4>

      {/* Description Snippet */}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
        {description}
      </p>

      {/* Footer Meta */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span>{estimatedHours} hrs</span>
        </div>

        {resourcesCount > 0 ? (
          <div className="flex items-center gap-1 text-primary font-medium">
            <BookOpen className="w-3 h-3" />
            <span>{resourcesCount} resource{resourcesCount > 1 ? "s" : ""}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Phase {level}</span>
        )}
      </div>

      {/* Source output handle to children */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-muted-foreground/40 !border-2 !border-background group-hover:!bg-primary transition-colors"
      />
    </div>
  );
});

CustomRoadmapNode.displayName = "CustomRoadmapNode";
