import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, awardBadge } from "@/lib/community";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challengeId = params.id;
    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const body = await req.json();
    const { proofUrl, notes } = body;

    if (!proofUrl && !notes) {
      return NextResponse.json(
        { error: "Please provide either a solution URL or notes describing your work" },
        { status: 400 }
      );
    }

    // Upsert submission
    const submission = await db.challengeSubmission.upsert({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        },
      },
      update: {
        proofUrl: proofUrl || null,
        notes: notes || null,
        status: "APPROVED",
      },
      create: {
        challengeId,
        userId,
        proofUrl: proofUrl || null,
        notes: notes || null,
        status: "APPROVED",
      },
    });

    // Award XP
    const newXP = await awardXP(
      userId,
      challenge.xpReward,
      `Completed peer challenge: ${challenge.title}`,
      "CHALLENGE"
    );

    // Award badge
    const newBadge = await awardBadge(userId, "Challenge Solver");

    // Automatically create a milestone post in community feed celebrating the submission
    await db.post.create({
      data: {
        userId,
        type: "MILESTONE",
        content: `Completed the "${challenge.title}" peer challenge! ${notes ? `"${notes.slice(0, 140)}..."` : "Check it out!"} 🎯`,
        milestoneData: JSON.stringify({
          title: "Peer Challenge Completed",
          challengeTitle: challenge.title,
          category: challenge.category,
          xpEarned: challenge.xpReward,
        }),
      },
    });

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        proofUrl: submission.proofUrl,
        notes: submission.notes,
      },
      xpAwarded: challenge.xpReward,
      totalXP: newXP,
      newBadge: newBadge ? newBadge.badge.name : null,
    });
  } catch (err: any) {
    console.error("POST /api/community/challenges/[id]/submit error:", err);
    return NextResponse.json({ error: "Failed to submit challenge" }, { status: 500 });
  }
}
