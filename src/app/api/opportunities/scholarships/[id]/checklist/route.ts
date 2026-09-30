import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const scholarshipId = params.id;
    const { item, completed } = await req.json() as { item: string; completed: boolean };

    // Verify scholarship exists
    const scholarship = await db.scholarship.findUnique({
      where: { id: scholarshipId },
    });
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    // Upsert progress record
    const existing = await db.scholarshipChecklistProgress.findUnique({
      where: { userId_scholarshipId: { userId, scholarshipId } },
    });

    let completedItems: string[] = [];
    if (existing) {
      try { completedItems = JSON.parse(existing.completedItems); } catch {}
    }

    if (completed) {
      if (!completedItems.includes(item)) completedItems.push(item);
    } else {
      completedItems = completedItems.filter((i) => i !== item);
    }

    const progress = await db.scholarshipChecklistProgress.upsert({
      where: { userId_scholarshipId: { userId, scholarshipId } },
      update: { completedItems: JSON.stringify(completedItems) },
      create: {
        userId,
        scholarshipId,
        completedItems: JSON.stringify(completedItems),
      },
    });

    return NextResponse.json({
      completedItems: JSON.parse(progress.completedItems),
    });
  } catch (err) {
    console.error("Checklist toggle error:", err);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}