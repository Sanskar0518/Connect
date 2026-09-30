import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureCommunitySeeded } from "@/lib/community";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    await ensureCommunitySeeded();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "weekly"; // weekly | all-time
    const filter = searchParams.get("filter") || "all"; // all | college | track

    // Fetch current user's profile to know their college/track and privacy settings
    let currentUserProfile = null;
    if (userId) {
      currentUserProfile = await db.profile.findUnique({
        where: { userId },
        select: {
          college: true,
          targetRole: true,
          isAnonymous: true,
          optOutCommunity: true,
        },
      });
    }

    const userOptedOut = currentUserProfile?.optOutCommunity ?? false;

    // Build Prisma where clause
    const whereClause: any = {
      optOutCommunity: false,
    };

    if (filter === "college" && currentUserProfile?.college) {
      whereClause.college = currentUserProfile.college;
    } else if (filter === "track" && currentUserProfile?.targetRole) {
      whereClause.targetRole = currentUserProfile.targetRole;
    }

    const profiles = await db.profile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            badges: {
              include: {
                badge: true,
              },
            },
          },
        },
      },
    });

    // Score based on period
    const scoredProfiles = profiles.map((p) => {
      // In weekly mode, streak and recent activity weight in; in all-time, total XP dominates
      const displayScore =
        period === "weekly"
          ? Math.round(p.xp * 0.4 + p.streak * 45)
          : p.xp;

      return {
        profile: p,
        displayScore,
      };
    });

    // Sort by displayScore descending
    scoredProfiles.sort((a, b) => b.displayScore - a.displayScore);

    let userRank = null;
    const leaderboard = scoredProfiles.map((item, index) => {
      const p = item.profile;
      const isUser = p.userId === userId;
      const rank = index + 1;

      if (isUser) {
        userRank = rank;
      }

      const displayName = isUser
        ? p.user.name + (p.isAnonymous ? " (You - Anonymous)" : " (You)")
        : p.isAnonymous
        ? "Anonymous Student"
        : p.user.name;

      return {
        rank,
        userId: isUser ? p.userId : p.isAnonymous ? "anon" : p.userId,
        name: displayName,
        college: p.isAnonymous && !isUser ? "Peer College" : p.college || "Higher Ed Cohort",
        targetRole: p.targetRole || "Software Engineering",
        xp: p.xp,
        score: item.displayScore,
        streak: p.streak,
        readinessScore: p.readinessScore,
        badgesCount: p.user.badges?.length || 0,
        isUser,
        isAnonymous: p.isAnonymous,
      };
    });

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 30),
      totalParticipants: leaderboard.length,
      userRank,
      userOptedOut,
      period,
      filter,
      userCollege: currentUserProfile?.college || null,
      userTrack: currentUserProfile?.targetRole || null,
    });
  } catch (err: any) {
    console.error("GET /api/community/leaderboard error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
