import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP } from "@/lib/community";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    const postId = params.id;

    const comments = await db.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                college: true,
                isAnonymous: true,
              },
            },
          },
        },
      },
    });

    const formatted = comments.map((c) => {
      const isAuthorAnonymous = c.user.profile?.isAnonymous;
      const isCurrentUser = c.userId === userId;

      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: isCurrentUser ? c.user.id : isAuthorAnonymous ? "anon" : c.user.id,
          name: isCurrentUser
            ? c.user.name + (isAuthorAnonymous ? " (Anonymous to others)" : "")
            : isAuthorAnonymous
            ? "Anonymous Peer"
            : c.user.name,
          college: isAuthorAnonymous && !isCurrentUser ? "Partner College" : c.user.profile?.college || "Higher Ed Cohort",
          isAnonymous: !!isAuthorAnonymous,
          isCurrentUser,
        },
      };
    });

    return NextResponse.json({ comments: formatted });
  } catch (err: any) {
    console.error("GET /api/community/feed/[id]/comments error:", err);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

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
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        postId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                college: true,
                isAnonymous: true,
              },
            },
          },
        },
      },
    });

    // Award 10 XP for constructive peer commenting
    await awardXP(userId, 10, "Commented on peer milestone", "COMMUNITY");

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.user.id,
            name: comment.user.name,
            college: comment.user.profile?.college || "Higher Ed Cohort",
            isAnonymous: !!comment.user.profile?.isAnonymous,
            isCurrentUser: true,
          },
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/community/feed/[id]/comments error:", err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
