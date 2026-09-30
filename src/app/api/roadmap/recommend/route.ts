import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import {
  CareerPathwayRecommendationSchema,
  CareerPathwayRecommendation,
} from "@/lib/ai/schemas/pathway";
import { buildPathwayRecommendationPrompt } from "@/lib/ai/prompts/pathway";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // 1. Fetch student profile, skills, and latest gap analysis
  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      skills: { include: { skill: true } },
    },
  });

  const latestGap = await db.gapAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch all career tracks
  const rawTracks = await db.careerTrack.findMany({
    orderBy: { title: "asc" },
  });

  const tracks = rawTracks.map((t) => ({
    title: t.title,
    slug: t.slug,
    description: t.description,
    avgSalary: t.avgSalary,
    demandTrend: t.demandTrend,
    category: t.category,
    requiredSkills: typeof t.requiredSkills === "string" ? JSON.parse(t.requiredSkills) : t.requiredSkills,
  }));

  // 3. Compute skill overlaps for grounding and fallback
  const studentSkillNames = new Set(
    (profile?.skills || []).map((s) => s.skill.name.toLowerCase().trim())
  );

  const missingSkillsList: string[] = latestGap
    ? (JSON.parse(latestGap.missingSkills || "[]") as { skill: string }[]).map((m) => m.skill)
    : [];

  const scoredTracks = tracks.map((track) => {
    const required = track.requiredSkills as string[];
    const matched = required.filter((r) => studentSkillNames.has(r.toLowerCase().trim()));
    const missing = required.filter((r) => !studentSkillNames.has(r.toLowerCase().trim()));
    const rawPct = required.length > 0 ? (matched.length / required.length) * 100 : 50;
    // Base match with minimum floor based on general CS background
    const matchPercentage = Math.min(Math.max(Math.round(rawPct), 35), 96);

    return {
      trackSlug: track.slug,
      title: track.title,
      category: track.category,
      matchPercentage,
      avgSalary: track.avgSalary,
      demandTrend: track.demandTrend,
      fitReason:
        matched.length > 0
          ? `Strong overlap in ${matched.slice(0, 3).join(", ")}. Solid foundation for entry.`
          : `High growth trajectory in ${track.category} with clear upskilling milestones.`,
      criticalGaps: missing.slice(0, 4),
      estimatedTimeToReadiness: missing.length <= 2 ? "1-2 months" : missing.length <= 4 ? "3-4 months" : "5-6 months",
    };
  });

  // Sort by match percentage descending
  scoredTracks.sort((a, b) => b.matchPercentage - a.matchPercentage);

  const primaryFallback = scoredTracks[0] || {
    trackSlug: "full-stack-web-developer",
    title: "Full Stack Web Developer",
    category: "Software Engineering",
    matchPercentage: 88,
    avgSalary: "$95,000 - $145,000 / ₹12-24 LPA",
    demandTrend: "+21% YoY",
    fitReason: "Direct alignment with your existing programming coursework and projects.",
    criticalGaps: ["Next.js", "Docker", "RESTful API Design"],
    estimatedTimeToReadiness: "2-3 months",
  };

  const alternativeFallbacks = scoredTracks.slice(1, 3);

  const fallbackRecommendation: CareerPathwayRecommendation = {
    primaryTrack: primaryFallback,
    alternativeTracks: alternativeFallbacks,
    overallAnalysis: `Based on ${studentSkillNames.size} verified competencies and academic coursework, your profile shows the highest aptitude for ${primaryFallback.title}. Exploring adjacent tracks like ${alternativeFallbacks.map((a) => a.title).join(" or ")} offers high-salary alternatives.`,
  };

  // 4. Construct AI prompt
  const prompt = buildPathwayRecommendationPrompt({
    studentProfile: {
      name: profile?.user?.name || undefined,
      headline: profile?.headline || undefined,
      degree: profile?.degree || undefined,
      college: profile?.college || undefined,
      gpa: profile?.gpa || undefined,
      targetRole: profile?.targetRole || undefined,
      skills: (profile?.skills || []).map((s) => ({
        name: s.skill.name,
        category: s.skill.category,
        confidence: s.confidence,
      })),
    },
    missingSkills: missingSkillsList,
    availableTracks: tracks,
  });

  // 5. Generate with AI
  const aiResult = await generateStructured({
    prompt,
    schema: CareerPathwayRecommendationSchema,
    system:
      "You are Connect's expert AI Career Pathway Advisor. Compare student skills with career tracks and recommend the single best primary track and 2 alternative pathways.",
    temperature: 0.2,
    fallback: () => fallbackRecommendation,
  });

  return NextResponse.json({
    success: true,
    source: aiResult.source,
    confidence: aiResult.confidence,
    recommendation: aiResult.data,
  });
}
