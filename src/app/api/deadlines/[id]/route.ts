// PATCH /api/deadlines/[id]  – update application status (column)
// DELETE /api/deadlines/[id] – remove a tracked application

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_COLUMNS = [
  "SAVED",
  "APPLIED",
  "INTERVIEWING",
  "ACCEPTED",
  "REJECTED",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { column, deadline, notes, url } = body as {
    column?: string;
    deadline?: string | null;
    notes?: string;
    url?: string;
  };

  if (column && !VALID_COLUMNS.includes(column)) {
    return NextResponse.json(
      { error: "Invalid column value" },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await db.application.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      ...(column ? { column } : {}),
      ...(deadline !== undefined
        ? { deadline: deadline ? new Date(deadline) : null }
        : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(url !== undefined ? { url } : {}),
    },
  });

  // Award XP when moving to APPLIED for the first time
  if (column === "APPLIED" && existing.column === "SAVED") {
    await db.xPEvent.create({
      data: {
        userId: session.user.id,
        amount: 15,
        reason: `Applied to ${updated.title} at ${updated.organization}`,
        source: "RESUME",
      },
    });
    await db.profile.updateMany({
      where: { userId: session.user.id },
      data: { xp: { increment: 15 } },
    });
  }

  return NextResponse.json({ application: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.application.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.application.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
