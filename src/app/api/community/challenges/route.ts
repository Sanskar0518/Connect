import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureCommunitySeeded, awardXP } from "@/lib/community";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    await ensureCommunitySeeded();

    const challenges = await db.challenge.findMany({
      orderBy: { endDate: "asc" },
      include: {
        submissions: {
          select: {
            id: true,
            userId: true,
            status: true,
            proofUrl: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    const formatted = challenges.map((c) => {
      const userSubmission = userId
        ? c.submissions.find((s) => s.userId === userId) || null
        : null;

      const isExpired = new Date(c.endDate) < new Date();
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        xpReward: c.xpReward,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        daysRemaining,
        isExpired,
        submissionsCount: c.submissions.length,
        userSubmission: userSubmission
          ? {
              id: userSubmission.id,
              status: userSubmission.status,
              proofUrl: userSubmission.proofUrl,
              notes: userSubmission.notes,
              submittedAt: userSubmission.createdAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ challenges: formatted });
  } catch (err: any) {
    console.error("GET /api/community/challenges error:", err);
    return NextResponse.json({ error: "Failed to load challenges" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category = "General", xpReward = 100, daysValid = 7 } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const challenge = await db.challenge.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        xpReward: Number(xpReward) || 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + (Number(daysValid) || 7) * 24 * 60 * 60 * 1000),
      },
    });

    // Award bonus XP for challenge creation
    await awardXP(userId, 30, `Created peer challenge: ${title}`, "CHALLENGE");

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/community/challenges error:", err);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
