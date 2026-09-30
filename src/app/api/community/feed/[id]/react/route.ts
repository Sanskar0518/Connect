import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP } from "@/lib/community";

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

    const postId = params.id;
    const body = await req.json();
    const { type = "LIKE" } = body;

    const validTypes = ["LIKE", "CELEBRATE", "SUPPORT"];
    const reactionType = validTypes.includes(type) ? type : "LIKE";

    // Check if user already has this reaction
    const existing = await db.reaction.findUnique({
      where: {
        postId_userId_type: {
          postId,
          userId,
          type: reactionType,
        },
      },
    });

    if (existing) {
      // Toggle off
      await db.reaction.delete({
        where: { id: existing.id },
      });
      // Decrement post likesCount
      await db.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
    } else {
      // Remove any other reaction of different type from this user on this post
      await db.reaction.deleteMany({
        where: {
          postId,
          userId,
        },
      });

      // Add new reaction
      await db.reaction.create({
        data: {
          postId,
          userId,
          type: reactionType,
        },
      });

      // Increment likesCount
      await db.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      // Micro-reward for engaging with peers
      await awardXP(userId, 5, "Reacted to peer post", "COMMUNITY");
    }

    // Return updated reaction counts
    const reactions = await db.reaction.findMany({
      where: { postId },
      select: { type: true, userId: true },
    });

    const reactionCounts: Record<string, number> = {
      LIKE: 0,
      CELEBRATE: 0,
      SUPPORT: 0,
    };
    let userReaction: string | null = null;

    for (const r of reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      if (r.userId === userId) {
        userReaction = r.type;
      }
    }

    return NextResponse.json({
      reactions: reactionCounts,
      userReaction,
    });
  } catch (err: any) {
    console.error("POST /api/community/feed/[id]/react error:", err);
    return NextResponse.json({ error: "Failed to react to post" }, { status: 500 });
  }
}
