// F7: AI-Powered Internship & Job Matching
// GET /api/opportunities/match  – returns AI-ranked job matches for the current user

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { JobMatchSchema } from "@/lib/ai/schemas/matching";
import { buildJobMatchPrompt } from "@/lib/ai/prompts/matching";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user profile + skills + latest gap analysis
  const [profile, gapAnalysis] = await Promise.all([
    db.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: { include: { skill: true } } },
    }),
    db.gapAnalysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const userSkills = profile?.skills.map((ps) => ps.skill.name) ?? [];
  const targetRole = profile?.targetRole ?? "Software Engineer Intern";
  const readinessPct = gapAnalysis?.readinessPct ?? 50;

  // Fetch internships + jobs from DB (limit to 20 for prompt size)
  const jobs = await db.job.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  if (jobs.length === 0) {
    return NextResponse.json({ matches: [], source: "empty" });
  }

  const jobsPayload = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    requirements: JSON.parse(j.requirements) as string[],
    description: j.description,
  }));

  const prompt = buildJobMatchPrompt({
    userSkills,
    targetRole,
    readinessPct,
    jobs: jobsPayload,
  });

  const cacheKey = `job-match:${session.user.id}:${jobs.map((j) => j.id).join(",")}`;

  const aiResult = await generateStructured({
    prompt,
    schema: JobMatchSchema,
    system: "You are a career matching AI. Return only valid JSON.",
    temperature: 0.2,
    cacheKey,
    fallback: () => ({
      matches: jobs.map((j, i) => ({
        jobId: j.id,
        matchScore: Math.max(40, 90 - i * 5),
        skillOverlap: userSkills.slice(0, 3),
        skillGaps: (JSON.parse(j.requirements) as string[]).slice(0, 2),
        whyMatch: `This role aligns with your interest in ${targetRole}.`,
        applicationTip:
          "Tailor your resume to highlight relevant project experience.",
      })),
    }),
  });

  // Enrich with job metadata
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const enriched = aiResult.data.matches
    .map((match) => {
      const job = jobMap.get(match.jobId);
      if (!job) return null;
      return {
        ...match,
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          deadline: job.deadline,
          url: job.url,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    matches: enriched,
    source: aiResult.source,
    userProfile: {
      targetRole,
      readinessPct,
      skillCount: userSkills.length,
    },
  });
}
