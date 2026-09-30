"use client";

import React, { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomRoadmapNode, RoadmapNodeData } from "./roadmap-node";
import { NodeDrawerData } from "./node-drawer";

interface RoadmapCanvasProps {
  nodes: NodeDrawerData[];
  onSelectNode: (nodeId: string) => void;
  onToggleStatus: (nodeId: string, nextStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") => void;
  selectedNodeId?: string | null;
}

// Define custom node types outside component for React Flow reference stability
const nodeTypes: NodeTypes = {
  roadmapNode: CustomRoadmapNode,
};

export function RoadmapCanvas({
  nodes,
  onSelectNode,
  onToggleStatus,
  selectedNodeId,
}: RoadmapCanvasProps) {

  // Group nodes by level to compute clean hierarchical DAG coordinates
  const { flowNodes, flowEdges } = useMemo(() => {
    const levelMap = new Map<number, NodeDrawerData[]>();
    for (const node of nodes) {
      const lvl = node.level || 1;
      if (!levelMap.has(lvl)) levelMap.set(lvl, []);
      levelMap.get(lvl)!.push(node);
    }

    const calculatedNodes: Node<RoadmapNodeData>[] = [];
    const calculatedEdges: Edge[] = [];

    // Layout configuration
    const NODE_WIDTH = 280;
    const HORIZONTAL_GAP = 70;
    const VERTICAL_GAP = 180;
    const CANVAS_CENTER_X = 500;

    levelMap.forEach((levelNodes, level) => {
      const totalLevelWidth = levelNodes.length * NODE_WIDTH + (levelNodes.length - 1) * HORIZONTAL_GAP;
      const startX = CANVAS_CENTER_X - totalLevelWidth / 2;
      const y = (level - 1) * VERTICAL_GAP + 60;

      levelNodes.forEach((node, colIndex) => {
        const x = startX + colIndex * (NODE_WIDTH + HORIZONTAL_GAP);

        calculatedNodes.push({
          id: node.id,
          type: "roadmapNode",
          position: { x, y },
          selected: node.id === selectedNodeId,
          data: {
            id: node.id,
            title: node.title,
            description: node.description,
            category: node.category,
            level: node.level,
            estimatedHours: node.estimatedHours,
            status: node.status,
            resourcesCount: node.resources?.length || 0,
            onSelectNode,
            onToggleStatus,
          },
        });

        // Add edges from dependencies
        if (node.dependsOn && Array.isArray(node.dependsOn)) {
          for (const parentId of node.dependsOn) {
            const parentNode = nodes.find((n) => n.id === parentId);
            const isCompleted = parentNode?.status === "COMPLETED";
            const isActive = parentNode?.status === "IN_PROGRESS";

            calculatedEdges.push({
              id: `edge-${parentId}-${node.id}`,
              source: parentId,
              target: node.id,
              type: "smoothstep",
              animated: isActive,
              style: {
                stroke: isCompleted
                  ? "#10b981"
                  : isActive
                  ? "#6366f1"
                  : "var(--border, #cbd5e1)",
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isCompleted
                  ? "#10b981"
                  : isActive
                  ? "#6366f1"
                  : "#94a3b8",
                width: 16,
                height: 16,
              },
            });
          }
        }
      });
    });

    return { flowNodes: calculatedNodes, flowEdges: calculatedEdges };
  }, [nodes, selectedNodeId, onSelectNode, onToggleStatus]);

  return (
    <div className="w-full h-[620px] rounded-2xl border border-border bg-card/40 relative overflow-hidden shadow-sm">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        className="touch-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.5}
          className="opacity-40"
        />
        <Controls
          className="!bg-card !border !border-border !rounded-xl !shadow-sm !overflow-hidden"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as RoadmapNodeData;
            if (data?.status === "COMPLETED") return "#10b981";
            if (data?.status === "IN_PROGRESS") return "#6366f1";
            return "#94a3b8";
          }}
          className="!bg-card !border !border-border !rounded-xl !overflow-hidden shadow-sm"
          maskColor="rgba(0,0,0,0.15)"
        />
      </ReactFlow>
    </div>
  );
}
