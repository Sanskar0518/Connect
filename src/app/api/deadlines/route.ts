// F12: Deadline Tracker
// GET  /api/deadlines  – list all tracked deadlines (applications + scholarships + jobs)
// POST /api/deadlines  – add a custom deadline

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLevel(
  days: number | null
): "overdue" | "critical" | "soon" | "upcoming" | "none" {
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days <= 3) return "critical";
  if (days <= 7) return "soon";
  if (days <= 30) return "upcoming";
  return "none";
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. User applications
  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
  });

  // 2. Scholarships with deadlines
  const scholarships = await db.scholarship.findMany({
    where: { deadline: { not: null } },
    include: {
      progress: { where: { userId: session.user.id } },
    },
    orderBy: { deadline: "asc" },
    take: 20,
  });

  // 3. Jobs with deadlines (not already applied)
  const jobs = await db.job.findMany({
    where: { deadline: { not: null } },
    orderBy: { deadline: "asc" },
    take: 20,
  });

  const appliedSourceIds = new Set(
    applications.map((a) => a.sourceId).filter(Boolean)
  );

  const deadlineItems = [
    ...applications.map((app) => {
      const days = daysUntil(app.deadline);
      return {
        id: app.id,
        type: "APPLICATION" as const,
        title: app.title,
        organization: app.organization,
        deadline: app.deadline,
        daysUntil: days,
        urgency: urgencyLevel(days),
        status: app.column,
        url: app.url,
        notes: app.notes,
        sourceType: app.sourceType,
      };
    }),
    ...scholarships.map((s) => {
      const days = daysUntil(s.deadline);
      const userProgress = s.progress[0];
      const completedItems = userProgress
        ? (JSON.parse(userProgress.completedItems) as string[]).length
        : 0;
      const totalItems = (JSON.parse(s.checklist) as string[]).length;
      return {
        id: `scholarship:${s.id}`,
        type: "SCHOLARSHIP" as const,
        title: s.title,
        organization: s.provider,
        deadline: s.deadline,
        daysUntil: days,
        urgency: urgencyLevel(days),
        status: `${completedItems}/${totalItems} tasks done`,
        url: s.url,
        amount: s.amount,
      };
    }),
    ...jobs
      .filter((j) => !appliedSourceIds.has(j.id))
      .map((j) => {
        const days = daysUntil(j.deadline);
        return {
          id: `job:${j.id}`,
          type: "JOB" as const,
          title: j.title,
          organization: j.company,
          deadline: j.deadline,
          daysUntil: days,
          urgency: urgencyLevel(days),
          status: "NOT_APPLIED",
          url: j.url,
          jobType: j.type,
        };
      }),
  ];

  const urgencyOrder = {
    overdue: 0,
    critical: 1,
    soon: 2,
    upcoming: 3,
    none: 4,
  };
  deadlineItems.sort((a, b) => {
    const urgDiff =
      urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgDiff !== 0) return urgDiff;
    if (a.deadline && b.deadline)
      return (
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    return 0;
  });

  const stats = {
    total: deadlineItems.length,
    overdue: deadlineItems.filter((d) => d.urgency === "overdue").length,
    critical: deadlineItems.filter((d) => d.urgency === "critical").length,
    upcoming: deadlineItems.filter((d) =>
      ["soon", "upcoming"].includes(d.urgency)
    ).length,
    applied: applications.filter((a) => a.column !== "SAVED").length,
  };

  return NextResponse.json({ deadlines: deadlineItems, stats });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, organization, deadline, sourceType, url, notes, sourceId } =
    body as {
      title: string;
      organization: string;
      deadline?: string;
      sourceType?: string;
      url?: string;
      notes?: string;
      sourceId?: string;
    };

  if (!title || !organization) {
    return NextResponse.json(
      { error: "title and organization are required" },
      { status: 400 }
    );
  }

  const application = await db.application.create({
    data: {
      userId: session.user.id,
      title,
      organization,
      deadline: deadline ? new Date(deadline) : null,
      sourceType: sourceType ?? "OTHER",
      url: url ?? null,
      notes: notes ?? null,
      sourceId: sourceId ?? null,
      column: "SAVED",
    },
  });

  const days = daysUntil(application.deadline);
  return NextResponse.json({
    application: {
      ...application,
      daysUntil: days,
      urgency: urgencyLevel(days),
    },
  });
}
