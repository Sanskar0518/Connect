/**
 * POST /api/profile/gap-analysis
 * Computes AI-powered skill gap analysis for the current user against a target role/company.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { GapAnalysisResultSchema } from "@/lib/ai/schemas/gap-analysis";
import { buildGapAnalysisPrompt } from "@/lib/ai/prompts/gap-analysis";
import { skillProvider } from "@/lib/adapters/skills";

const RequestSchema = z.object({
  targetRole: z.string().min(2).max(100),
  companyId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { targetRole, companyId } = parsed.data;

  // Load profile + skills
  const profile = await db.profile.findUnique({
    where: { userId },
    include: { skills: { include: { skill: true } } },
  });

  const profileSkills = (profile?.skills || []).map((ps) => ({
    name: ps.skill.name,
    confidence: ps.confidence,
  }));

  // Load company benchmark if requested
  let companyName: string | undefined;
  let requiredCompetencies: { skillName: string; importance: string; targetScore: number }[] = [];

  if (companyId) {
    const benchmark = await db.companyBenchmark.findFirst({
      where: { companyId, role: { contains: targetRole } },
      include: { company: true },
    });
    if (benchmark) {
      companyName = benchmark.company.name;
      const weights = JSON.parse(benchmark.skillWeights) as Record<string, number>;
      requiredCompetencies = Object.entries(weights).map(([skillName, weight]) => ({
        skillName,
        importance: weight >= 80 ? "Critical" : weight >= 60 ? "Important" : "Nice-to-have",
        targetScore: weight,
      }));
    }
  }

  // Fallback to skill framework adapter if no benchmark data
  if (requiredCompetencies.length === 0) {
    const competencies = await skillProvider.getRoleCompetencies(targetRole);
    requiredCompetencies = competencies.map((c) => ({
      skillName: c.skillName,
      importance: c.importance,
      targetScore: c.targetScore,
    }));
  }

  // Build a content-hash cache key
  const cacheKey = `gap:${userId}:${targetRole}:${companyId || "any"}:${profileSkills.length}`;

  const aiResult = await generateStructured({
    prompt: buildGapAnalysisPrompt({ profileSkills, requiredCompetencies, targetRole, companyName }),
    schema: GapAnalysisResultSchema,
    temperature: 0.15,
    cacheKey,
    fallback: () => ({
      targetRole,
      matchedSkills: profileSkills.slice(0, 3).map((s) => ({ skill: s.name, confidence: s.confidence })),
      missingSkills: requiredCompetencies
        .filter((c) => !profileSkills.find((p) => p.name.toLowerCase() === c.skillName.toLowerCase()))
        .slice(0, 5)
        .map((c) => ({
          skill: c.skillName,
          severity: c.importance as "Critical" | "Important" | "Nice-to-have",
          reason: `Required for ${targetRole} roles.`,
        })),
      readinessPct: Math.round((profileSkills.length / Math.max(requiredCompetencies.length, 1)) * 100),
      summary: `You have ${profileSkills.length} skills identified. Focus on closing critical gaps first.`,
    }),
  });

  const gapData = aiResult.data;

  // Persist gap analysis
  await db.gapAnalysis.create({
    data: {
      userId,
      targetRole,
      targetCompanyId: companyId,
      matchedSkills: JSON.stringify(gapData.matchedSkills),
      missingSkills: JSON.stringify(gapData.missingSkills),
      readinessPct: gapData.readinessPct,
    },
  });

  // Update profile readiness score
  if (profile) {
    await db.profile.update({
      where: { userId },
      data: { readinessScore: gapData.readinessPct },
    });
  }

  return NextResponse.json({
    ...gapData,
    source: aiResult.source,
    confidence: aiResult.confidence,
  });
}
