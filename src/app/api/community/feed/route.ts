import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureCommunitySeeded, awardXP, awardBadge } from "@/lib/community";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    await ensureCommunitySeeded();

    const posts = await db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                college: true,
                targetRole: true,
                isAnonymous: true,
              },
            },
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => {
      const isAuthorAnonymous = post.user.profile?.isAnonymous;
      const isCurrentUser = post.userId === userId;

      // Group reactions by type
      const reactionCounts: Record<string, number> = {
        LIKE: 0,
        CELEBRATE: 0,
        SUPPORT: 0,
      };
      let userReaction: string | null = null;

      for (const r of post.reactions) {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
        if (userId && r.userId === userId) {
          userReaction = r.type;
        }
      }

      let parsedMilestone = null;
      if (post.milestoneData) {
        try {
          parsedMilestone = JSON.parse(post.milestoneData);
        } catch {
          parsedMilestone = null;
        }
      }

      return {
        id: post.id,
        content: post.content,
        type: post.type,
        milestoneData: parsedMilestone,
        createdAt: post.createdAt.toISOString(),
        author: {
          id: isCurrentUser ? post.user.id : isAuthorAnonymous ? "anon" : post.user.id,
          name: isCurrentUser
            ? post.user.name + (isAuthorAnonymous ? " (Anonymous to others)" : "")
            : isAuthorAnonymous
            ? "Anonymous Peer"
            : post.user.name,
          college: isAuthorAnonymous && !isCurrentUser ? "Partner College" : post.user.profile?.college || "Higher Ed Cohort",
          targetRole: isAuthorAnonymous && !isCurrentUser ? null : post.user.profile?.targetRole || null,
          isAnonymous: !!isAuthorAnonymous,
          isCurrentUser,
        },
        reactions: reactionCounts,
        userReaction,
        commentsCount: post._count.comments,
      };
    });

    return NextResponse.json({ posts: formattedPosts });
  } catch (err: any) {
    console.error("GET /api/community/feed error:", err);
    return NextResponse.json({ error: "Failed to load community feed" }, { status: 500 });
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
    const { content, type = "GENERAL", milestoneData, isAnonymous } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // If author requested anonymity on this post, update profile isAnonymous if not set
    if (isAnonymous) {
      await db.profile.updateMany({
        where: { userId },
        data: { isAnonymous: true },
      });
    }

    const post = await db.post.create({
      data: {
        userId,
        content: content.trim(),
        type: ["MILESTONE", "QUESTION", "GENERAL"].includes(type) ? type : "GENERAL",
        milestoneData: milestoneData ? JSON.stringify(milestoneData) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                college: true,
                targetRole: true,
                isAnonymous: true,
              },
            },
          },
        },
      },
    });

    // Award XP
    const newXP = await awardXP(userId, 20, "Shared post in community feed", "COMMUNITY");

    // Award badge if milestone
    let newBadge = null;
    if (type === "MILESTONE") {
      newBadge = await awardBadge(userId, "First Milestone");
    }

    return NextResponse.json(
      {
        post: {
          id: post.id,
          content: post.content,
          type: post.type,
          milestoneData,
          createdAt: post.createdAt.toISOString(),
          author: {
            id: post.user.id,
            name: post.user.name,
            college: post.user.profile?.college || "Higher Ed Cohort",
            targetRole: post.user.profile?.targetRole || null,
            isAnonymous: !!post.user.profile?.isAnonymous,
            isCurrentUser: true,
          },
          reactions: { LIKE: 0, CELEBRATE: 0, SUPPORT: 0 },
          userReaction: null,
          commentsCount: 0,
        },
        xpAwarded: 20,
        totalXP: newXP,
        newBadge: newBadge ? newBadge.badge.name : null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/community/feed error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
