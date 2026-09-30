import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      title,
      organization,
      sourceType,
      sourceId,
      deadline,
      url,
    } = await req.json() as {
      title: string;
      organization: string;
      sourceType: "JOB" | "SCHOLARSHIP" | "GOV" | "OTHER";
      sourceId?: string;
      deadline?: string;
      url?: string;
    };

    if (!title || !organization || !sourceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Deduplication: check if already saved
    if (sourceId) {
      const existing = await db.application.findFirst({
        where: { userId, sourceId, sourceType },
      });
      if (existing) {
        return NextResponse.json({ application: existing, alreadySaved: true });
      }
    }

    const application = await db.application.create({
      data: {
        userId,
        title,
        organization,
        column: "SAVED",
        sourceType,
        sourceId: sourceId || null,
        deadline: deadline ? new Date(deadline) : null,
        url: url || null,
      },
    });

    return NextResponse.json({ application, alreadySaved: false }, { status: 201 });
  } catch (err) {
    console.error("Save opportunity error:", err);
    return NextResponse.json({ error: "Failed to save opportunity" }, { status: 500 });
  }
}