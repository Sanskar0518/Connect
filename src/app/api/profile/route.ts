/**
 * GET /api/profile
 * Returns the current user's full profile, skills, courses, projects, and latest gap analysis.
 *
 * PATCH /api/profile
 * Updates editable profile fields (targetRole, headline, bio, college, degree, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const PatchSchema = z.object({
  targetRole: z.string().max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  college: z.string().max(200).optional(),
  degree: z.string().max(200).optional(),
  graduationYear: z.number().int().min(2000).max(2040).optional(),
  gpa: z.number().min(0).max(10).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true }, orderBy: { confidence: "desc" } },
      courses: { orderBy: { createdAt: "asc" } },
      projects: { orderBy: { createdAt: "asc" } },
    },
  });

  const latestGap = await db.gapAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const companies = await db.company.findMany({
    select: { id: true, name: true, slug: true, industry: true, logoUrl: true },
    take: 15,
  });

  return NextResponse.json({ profile, latestGap, companies });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ profile });
}
