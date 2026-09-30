// GET /api/interview/session/[id]  - get single session with all turns and feedback
// DELETE /api/interview/session/[id] - delete session

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const interview = await db.interviewSession.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      feedback: true,
      turns: {
        orderBy: { turnNumber: "asc" },
      },
    },
  });

  if (!interview) {
    return NextResponse.json(
      { error: "Interview session not found." },
      { status: 404 }
    );
  }

  const parsedFeedback = interview.feedback
    ? {
        ...interview.feedback,
        strengths: (() => {
          try {
            return JSON.parse(interview.feedback.strengths);
          } catch {
            return [];
          }
        })(),
        improvements: (() => {
          try {
            return JSON.parse(interview.feedback.improvements);
          } catch {
            return [];
          }
        })(),
      }
    : null;

  return NextResponse.json({
    interview: {
      ...interview,
      feedback: parsedFeedback,
      turns: interview.turns.map((t) => ({
        ...t,
        feedback: (() => {
          try {
            return t.feedback ? JSON.parse(t.feedback) : null;
          } catch {
            return t.feedback;
          }
        })(),
      })),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const interview = await db.interviewSession.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!interview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.interviewSession.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
