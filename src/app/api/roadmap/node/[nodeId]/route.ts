import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { nodeId } = params;

  const body = await req.json().catch(() => ({}));
  const nextStatus = body.status;

  if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(nextStatus)) {
    return NextResponse.json(
      { error: "Invalid status. Must be NOT_STARTED, IN_PROGRESS, or COMPLETED." },
      { status: 400 }
    );
  }

  // 1. Verify node exists and belongs to a roadmap
  const node = await db.roadmapNode.findUnique({
    where: { id: nodeId },
    include: { roadmap: true },
  });

  if (!node) {
    return NextResponse.json({ error: "Roadmap node not found" }, { status: 404 });
  }

  // 2. Fetch existing progress
  const existingProg = await db.nodeProgress.findUnique({
    where: {
      userId_nodeId: {
        userId,
        nodeId,
      },
    },
  });

  const wasCompleted = existingProg?.status === "COMPLETED";
  const isNowCompleted = nextStatus === "COMPLETED";

  // 3. Upsert NodeProgress
  const updatedProgress = await db.nodeProgress.upsert({
    where: {
      userId_nodeId: {
        userId,
        nodeId,
      },
    },
    update: {
      status: nextStatus,
      completedAt: isNowCompleted ? new Date() : wasCompleted ? null : existingProg?.completedAt,
    },
    create: {
      userId,
      nodeId,
      status: nextStatus,
      completedAt: isNowCompleted ? new Date() : null,
    },
  });

  // 4. Award XP on first completion
  let xpAwarded = 0;
  let currentProfileXp = 0;

  if (isNowCompleted && !wasCompleted) {
    xpAwarded = 100;
    const updatedProfile = await db.profile.update({
      where: { userId },
      data: {
        xp: { increment: xpAwarded },
      },
      select: { xp: true },
    });
    currentProfileXp = updatedProfile.xp;
  } else {
    const profile = await db.profile.findUnique({
      where: { userId },
      select: { xp: true },
    });
    currentProfileXp = profile?.xp || 0;
  }

  // 5. Recalculate Roadmap Completion Percentage
  const allNodesInRoadmap = await db.roadmapNode.findMany({
    where: { roadmapId: node.roadmapId },
    select: { id: true },
  });

  const completedCount = await db.nodeProgress.count({
    where: {
      userId,
      nodeId: { in: allNodesInRoadmap.map((n) => n.id) },
      status: "COMPLETED",
    },
  });

  const totalCount = allNodesInRoadmap.length;
  const newProgressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  await db.roadmap.update({
    where: { id: node.roadmapId },
    data: { progress: newProgressPct },
  });

  return NextResponse.json({
    success: true,
    nodeId,
    status: updatedProgress.status,
    completedAt: updatedProgress.completedAt,
    roadmapProgress: newProgressPct,
    completedNodes: completedCount,
    totalNodes: totalCount,
    xpAwarded,
    totalXp: currentProfileXp,
  });
}
