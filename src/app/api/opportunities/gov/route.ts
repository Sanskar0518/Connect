import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || undefined;
    const type = searchParams.get("type") || undefined;
    const qualification = searchParams.get("qualification") || undefined;
    const search = searchParams.get("search") || undefined;

    const records = await db.govOpportunity.findMany({
      where: {
        ...(state && state !== "All" ? { state: { contains: state } } : {}),
        ...(type && type !== "All" ? { type } : {}),
        ...(qualification
          ? { qualification: { contains: qualification } }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { department: { contains: search } },
                { scheme: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      take: 50,
    });

    // Get saved applications for dedup
    const savedIds = new Set<string>();
    if (userId) {
      const saved = await db.application.findMany({
        where: { userId, sourceType: "GOV" },
        select: { sourceId: true },
      });
      saved.forEach((a) => a.sourceId && savedIds.add(a.sourceId));
    }

    return NextResponse.json({
      opportunities: records.map((r) => ({
        id: r.id,
        title: r.title,
        department: r.department,
        scheme: r.scheme,
        state: r.state,
        qualification: r.qualification,
        deadline: r.deadline ? r.deadline.toISOString() : null,
        description: r.description,
        url: r.url,
        type: r.type,
        isSaved: savedIds.has(r.id),
      })),
    });
  } catch (err) {
    console.error("Gov opportunities API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch government opportunities" },
      { status: 500 }
    );
  }
}