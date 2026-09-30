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

    const allBadges = await db.badge.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        userBadges: userId
          ? {
              where: { userId },
              select: { earnedAt: true },
            }
          : false,
      },
    });

    const formatted = allBadges.map((b) => {
      const earned = b.userBadges && b.userBadges.length > 0;
      return {
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        isEarned: !!earned,
        earnedAt: earned ? b.userBadges[0].earnedAt.toISOString() : null,
      };
    });

    return NextResponse.json({ badges: formatted });
  } catch (err: any) {
    console.error("GET /api/community/badges error:", err);
    return NextResponse.json({ error: "Failed to load badges" }, { status: 500 });
  }
}
