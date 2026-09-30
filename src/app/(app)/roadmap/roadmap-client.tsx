"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Map,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  RefreshCw,
  Compass,
  ListTodo,
  ExternalLink,
  ChevronRight,
  Flame,
} from "lucide-react";
import { AIBadge } from "@/components/common/ai-badge";
import { PathwaySelector, CareerTrackSummary } from "@/components/roadmap/pathway-selector";
import { RoadmapCanvas } from "@/components/roadmap/roadmap-canvas";
import { NodeDrawer, NodeDrawerData } from "@/components/roadmap/node-drawer";
import { PathwayModal } from "@/components/roadmap/pathway-modal";
import { ResourceCatalog } from "@/components/roadmap/resource-catalog";
import { CareerPathwayRecommendation } from "@/lib/ai/schemas/pathway";

interface RoadmapData {
  id: string;
  title: string;
  progress: number;
  completedNodes: number;
  totalNodes: number;
  track: CareerTrackSummary;
  nodes: NodeDrawerData[];
}

export function RoadmapClient() {
  const [tracks, setTracks] = useState<CareerTrackSummary[]>([]);
  const [selectedTrackSlug, setSelectedTrackSlug] = useState<string>("full-stack-web-developer");
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"canvas" | "catalog" | "checklist">("canvas");

  // Node Drawer state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isUpdatingNode, setIsUpdatingNode] = useState<boolean>(false);

  // Pathway Recommendations state
  const [isPathwayModalOpen, setIsPathwayModalOpen] = useState<boolean>(false);
  const [pathwayRecommendation, setPathwayRecommendation] = useState<CareerPathwayRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState<boolean>(false);

  // Student Profile XP
  const [userXp, setUserXp] = useState<number>(0);
  const [userGaps, setUserGaps] = useState<string[]>([]);
  const [xpNotification, setXpNotification] = useState<string | null>(null);

  // 1. Fetch available career tracks and user profile stats on mount
  useEffect(() => {
    async function init() {
      try {
        const [tracksRes, profileRes] = await Promise.all([
          fetch("/api/roadmap/tracks"),
          fetch("/api/profile"),
        ]);

        if (tracksRes.ok) {
          const tData = await tracksRes.json();
          setTracks(tData.tracks || []);
        }

        if (profileRes.ok) {
          const pData = await profileRes.json();
          setUserXp(pData.profile?.xp || 0);
          if (pData.gapAnalysis?.missingSkills) {
            try {
              const parsed = JSON.parse(pData.gapAnalysis.missingSkills);
              setUserGaps(parsed.map((m: { skill: string }) => m.skill));
            } catch {
              setUserGaps([]);
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // 2. Fetch or Generate Roadmap for selected track
  const loadRoadmap = useCallback(async (slug: string, force = false) => {
    setIsLoadingRoadmap(true);
    try {
      if (force) {
        setIsGenerating(true);
        const genRes = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackSlug: slug, forceRegenerate: true }),
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          setRoadmap(genData.roadmap || null);
        }
      } else {
        const res = await fetch(`/api/roadmap?trackSlug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setRoadmap(data.roadmap);
          } else {
            // Auto-generate if roadmap doesn't exist yet for this track
            setIsGenerating(true);
            const genRes = await fetch("/api/roadmap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackSlug: slug }),
            });
            if (genRes.ok) {
              const genData = await genRes.json();
              setRoadmap(genData.roadmap || null);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load roadmap:", err);
    } finally {
      setIsLoadingRoadmap(false);
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    loadRoadmap(selectedTrackSlug);
  }, [selectedTrackSlug, loadRoadmap]);

  // 3. Handle Node Selection
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const selectedNode = roadmap?.nodes.find((n) => n.id === selectedNodeId) || null;

  // 4. Handle Node Status Update
  const handleUpdateNodeStatus = async (
    nodeId: string,
    nextStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    if (!roadmap) return;
    setIsUpdatingNode(true);
    try {
      const res = await fetch(`/api/roadmap/node/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const result = await res.json();

        // Update local roadmap nodes state optimistically
        setRoadmap((prev) => {
          if (!prev) return null;
          const updatedNodes = prev.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status: nextStatus,
                  completedAt: result.completedAt,
                }
              : n
          );
          return {
            ...prev,
            progress: result.roadmapProgress,
            completedNodes: result.completedNodes,
            totalNodes: result.totalNodes,
            nodes: updatedNodes,
          };
        });

        // XP Notification
        if (result.xpAwarded > 0) {
          setUserXp(result.totalXp);
          setXpNotification(`+${result.xpAwarded} XP Earned! Milestone Completed!`);
          setTimeout(() => setXpNotification(null), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to update node status:", err);
    } finally {
      setIsUpdatingNode(false);
    }
  };

  // 5. Fetch AI Pathway Recommendations
  const handleOpenRecommendations = async () => {
    setIsPathwayModalOpen(true);
    if (!pathwayRecommendation) {
      setIsLoadingRecommendation(true);
      try {
        const res = await fetch("/api/roadmap/recommend", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setPathwayRecommendation(data.recommendation);
        }
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      } finally {
        setIsLoadingRecommendation(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for XP */}
      {xpNotification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <Award className="w-5 h-5 text-amber-300 animate-bounce" />
          <span className="font-bold text-sm">{xpNotification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Career Roadmap & Adaptive Learning
            </h1>
            <AIBadge confidence={0.96} label="Curriculum Engine" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            F3, F4, F9: Adaptive node-based milestone trees synthesized from your verified skills and academic gap analysis.
          </p>
        </div>

        {/* Global XP & Level Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span className="text-xs font-bold">{userXp} Total XP</span>
          </div>
        </div>
      </div>

      {/* Track & Pathway Selector Banner */}
      <PathwaySelector
        tracks={tracks}
        selectedTrackSlug={selectedTrackSlug}
        onSelectTrack={(slug) => setSelectedTrackSlug(slug)}
        progress={roadmap?.progress || 0}
        completedNodes={roadmap?.completedNodes || 0}
        totalNodes={roadmap?.totalNodes || 0}
        onRegenerate={() => loadRoadmap(selectedTrackSlug, true)}
        isGenerating={isGenerating}
        onOpenRecommendations={handleOpenRecommendations}
      />

      {/* View Toggle Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("canvas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "canvas"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Interactive Roadmap Graph (F9)</span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "catalog"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curated Learning Catalog (F4)</span>
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === "checklist"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Milestone Checklist ({roadmap?.completedNodes || 0}/{roadmap?.totalNodes || 0})</span>
        </button>
      </div>

      {/* Main View Area */}
      {isLoadingRoadmap ? (
        <div className="p-20 text-center rounded-2xl border border-border bg-card space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-bold text-foreground">
            {isGenerating ? "Synthesizing Adaptive Roadmap Tree..." : "Loading Career Pathway Tree..."}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Constructing progressive milestones, prerequisite dependencies, and mapping vetted certifications.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: Visual Interactive Canvas */}
          {activeTab === "canvas" && roadmap && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Tip: Click any node to open detailed checkpoints, syllabus objectives, and linked study materials.
                </span>
                <span className="font-semibold text-primary">
                  Click &apos;Start&apos; or &apos;Active&apos; to toggle status (+100 XP)
                </span>
              </div>

              <RoadmapCanvas
                nodes={roadmap.nodes}
                onSelectNode={handleSelectNode}
                onToggleStatus={handleUpdateNodeStatus}
                selectedNodeId={selectedNodeId}
              />
            </div>
          )}

          {/* TAB 2: Curated Learning Catalog (F4) */}
          {activeTab === "catalog" && (
            <ResourceCatalog trackSlug={selectedTrackSlug} userGaps={userGaps} />
          )}

          {/* TAB 3: Milestone Checklist */}
          {activeTab === "checklist" && roadmap && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {roadmap.nodes.map((node, idx) => {
                  const isDone = node.status === "COMPLETED";
                  const isActive = node.status === "IN_PROGRESS";

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleSelectNode(node.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDone
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
                          : isActive
                          ? "bg-card border-primary ring-2 ring-primary/20"
                          : "bg-card border-border hover:border-border/80"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                            Phase {node.level} • Milestone {idx + 1}
                          </span>
                          <span className="text-[10px] font-semibold text-secondary">
                            {node.category.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {node.estimatedHours} hrs
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-foreground leading-snug">
                          {node.title}
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {node.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateNodeStatus(
                              node.id,
                              isDone ? "NOT_STARTED" : "COMPLETED"
                            );
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isDone
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isDone ? "Completed (+100 XP)" : "Mark Done"}</span>
                        </button>

                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Node Detail Slide-Over Drawer */}
      <NodeDrawer
        node={selectedNode}
        isOpen={Boolean(selectedNodeId)}
        onClose={() => setSelectedNodeId(null)}
        onUpdateStatus={handleUpdateNodeStatus}
        isUpdating={isUpdatingNode}
      />

      {/* Pathway Fit Recommendation Modal (F3) */}
      <PathwayModal
        isOpen={isPathwayModalOpen}
        onClose={() => setIsPathwayModalOpen(false)}
        recommendation={pathwayRecommendation}
        isLoading={isLoadingRecommendation}
        onSelectTrack={(slug) => {
          setSelectedTrackSlug(slug);
        }}
        currentTrackSlug={selectedTrackSlug}
      />
    </div>
  );
}
