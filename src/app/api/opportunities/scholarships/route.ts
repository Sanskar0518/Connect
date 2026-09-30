import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Rule-based eligibility scoring (0-100)
function scoreEligibility(
  criteria: Record<string, unknown>,
  profile: { degree?: string | null; gpa?: number | null; graduationYear?: number | null }
): { score: number; badge: "Eligible" | "Likely Eligible" | "Review Criteria" } {
  let score = 100;
  const checks: boolean[] = [];

  // Degree check
  if (criteria.degree && Array.isArray(criteria.degree) && criteria.degree.length > 0) {
    const degreeMatch = criteria.degree.some(
      (d: unknown) =>
        typeof d === "string" &&
        profile.degree &&
        (profile.degree.toLowerCase().includes(d.toLowerCase()) ||
          d.toLowerCase().includes(profile.degree.toLowerCase().split(" ")[0].toLowerCase()))
    );
    checks.push(degreeMatch);
    if (!degreeMatch) score -= 35;
  }

  // GPA check
  if (typeof criteria.minGPA === "number" && profile.gpa !== null && profile.gpa !== undefined) {
    const gpaMatch = profile.gpa >= criteria.minGPA;
    checks.push(gpaMatch);
    if (!gpaMatch) score -= 30;
  }

  // Income / family check (we cannot know — assume eligible)
  // Gender check (we cannot know from profile — skip)

  // Graduation year check
  if (Array.isArray(criteria.year) && profile.graduationYear) {
    // Convert graduation year to academic year (1st year = 4 years before graduation)
    const currentYear = new Date().getFullYear();
    const academicYear = profile.graduationYear - currentYear + 1;
    const yearMatch = criteria.year.includes(academicYear);
    checks.push(yearMatch);
    if (!yearMatch) score -= 20;
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const badge: "Eligible" | "Likely Eligible" | "Review Criteria" =
    clampedScore >= 80 ? "Eligible" : clampedScore >= 50 ? "Likely Eligible" : "Review Criteria";

  return { score: clampedScore, badge };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const take = parseInt(searchParams.get("take") || "30");

    const records = await db.scholarship.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { provider: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : undefined,
      orderBy: [{ deadline: "asc" }],
      take,
      include: userId ? { progress: { where: { userId } } } : undefined,
    });

    // Get user profile for eligibility scoring
    let profile: { degree?: string | null; gpa?: number | null; graduationYear?: number | null } = {};
    if (userId) {
      const p = await db.profile.findUnique({ where: { userId } });
      profile = { degree: p?.degree, gpa: p?.gpa, graduationYear: p?.graduationYear };
    }

    // Get saved applications for dedup
    const savedIds = new Set<string>();
    if (userId) {
      const saved = await db.application.findMany({
        where: { userId, sourceType: "SCHOLARSHIP" },
        select: { sourceId: true },
      });
      saved.forEach((a) => a.sourceId && savedIds.add(a.sourceId));
    }

    const scholarships = records.map((s) => {
      let criteria: Record<string, unknown> = {};
      let checklist: string[] = [];
      try { criteria = JSON.parse(s.eligibilityCriteria); } catch {}
      try { checklist = JSON.parse(s.checklist); } catch {}

      const { score, badge } = scoreEligibility(criteria, profile);
      const progressRecord = (s as Record<string, unknown>).progress as Array<{ completedItems: string }> | undefined;
      let completedItems: string[] = [];
      try {
        completedItems = progressRecord?.[0]
          ? JSON.parse(progressRecord[0].completedItems)
          : [];
      } catch {}

      return {
        id: s.id,
        title: s.title,
        provider: s.provider,
        amount: s.amount,
        deadline: s.deadline ? s.deadline.toISOString() : null,
        eligibilityCriteria: criteria,
        description: s.description,
        url: s.url,
        checklist,
        eligibilityScore: score,
        eligibilityBadge: badge,
        completedItems,
        isSaved: savedIds.has(s.id),
      };
    });

    // Sort by eligibility score descending
    scholarships.sort((a, b) => b.eligibilityScore - a.eligibilityScore);

    return NextResponse.json({ scholarships });
  } catch (err) {
    console.error("Scholarships API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch scholarships" },
      { status: 500 }
    );
  }
}