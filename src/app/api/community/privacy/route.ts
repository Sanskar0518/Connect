import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.profile.findUnique({
      where: { userId },
      select: {
        isAnonymous: true,
        optOutCommunity: true,
      },
    });

    return NextResponse.json({
      isAnonymous: profile?.isAnonymous ?? false,
      optOutCommunity: profile?.optOutCommunity ?? false,
    });
  } catch (err: any) {
    console.error("GET /api/community/privacy error:", err);
    return NextResponse.json({ error: "Failed to load privacy settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isAnonymous, optOutCommunity } = body;

    const data: any = {};
    if (typeof isAnonymous === "boolean") data.isAnonymous = isAnonymous;
    if (typeof optOutCommunity === "boolean") data.optOutCommunity = optOutCommunity;

    const updated = await db.profile.update({
      where: { userId },
      data,
      select: {
        isAnonymous: true,
        optOutCommunity: true,
      },
    });

    return NextResponse.json({
      success: true,
      privacy: updated,
    });
  } catch (err: any) {
    console.error("PATCH /api/community/privacy error:", err);
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 });
  }
}
