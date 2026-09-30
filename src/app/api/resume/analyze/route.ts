// F5: AI Resume Optimizer
// POST /api/resume/analyze  – analyze a resume text with Gemini
// GET  /api/resume/analyze  – get latest analysis for the current user

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { ResumeAnalysisSchema } from "@/lib/ai/schemas/resume";
import { buildResumeAnalysisPrompt } from "@/lib/ai/prompts/resume";

// ── GET latest analysis ─────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = await db.resume.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!resume) {
    return NextResponse.json({ resume: null, analysis: null });
  }

  const analysis = resume.analyses[0] ?? null;
  return NextResponse.json({
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      createdAt: resume.createdAt,
    },
    analysis: analysis
      ? {
          id: analysis.id,
          atsScore: analysis.atsScore,
          keywords: JSON.parse(analysis.keywords),
          missingKeywords: JSON.parse(analysis.missingKeywords),
          issues: JSON.parse(analysis.issues),
          rewrites: JSON.parse(analysis.rewrites),
          createdAt: analysis.createdAt,
        }
      : null,
  });
}

// ── POST: analyze ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { resumeText, fileName, targetRole, targetCompany } = body as {
    resumeText: string;
    fileName: string;
    targetRole?: string;
    targetCompany?: string;
  };

  if (!resumeText || resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: "Resume text is too short or empty." },
      { status: 400 }
    );
  }

  // Fetch user profile + skills
  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    include: { skills: { include: { skill: true } } },
  });

  const role = targetRole || profile?.targetRole || "Software Engineer";
  const userSkills = profile?.skills.map((ps) => ps.skill.name) ?? [];

  const prompt = buildResumeAnalysisPrompt({
    resumeText,
    targetRole: role,
    targetCompany,
    userSkills,
  });

  const aiResult = await generateStructured({
    prompt,
    schema: ResumeAnalysisSchema,
    system: "You are an ATS expert and career coach. Return only valid JSON.",
    temperature: 0.15,
    cacheKey: `resume-analysis:${session.user.id}:${Buffer.from(resumeText.slice(0, 200)).toString("base64")}`,
    fallback: () => ({
      atsScore: 65,
      keywords: ["JavaScript", "Python", "React"],
      missingKeywords: ["CI/CD", "Docker", "System Design"],
      issues: [
        "Missing quantified achievements",
        "No summary section",
        "Weak action verbs",
      ],
      rewrites: [
        {
          section: "Experience",
          before: "Worked on frontend development",
          after:
            "Engineered 5+ responsive React components, reducing page load time by 30%",
          reason:
            "Action verb + quantified impact improves ATS keyword density and recruiter appeal",
        },
      ],
      summary:
        "Your resume has moderate ATS compatibility. Adding quantified achievements and key technical keywords will significantly improve your chances.",
      strengthAreas: [
        "Clear education section",
        "Good project descriptions",
        "Relevant tech stack listed",
      ],
      improvementPriorities: [
        "Add quantified achievements to every experience bullet",
        "Include a professional summary targeting your role",
        "Improve keyword density with role-specific terms",
      ],
    }),
  });

  // Persist resume record
  const resume = await db.resume.create({
    data: {
      userId: session.user.id,
      fileName: fileName || "resume.pdf",
      fileUrl: "",
      fileSize: resumeText.length,
    },
  });

  // Persist analysis
  const analysis = await db.resumeAnalysis.create({
    data: {
      resumeId: resume.id,
      atsScore: aiResult.data.atsScore,
      keywords: JSON.stringify(aiResult.data.keywords),
      missingKeywords: JSON.stringify(aiResult.data.missingKeywords),
      issues: JSON.stringify(aiResult.data.issues),
      rewrites: JSON.stringify(aiResult.data.rewrites),
    },
  });

  // Award XP
  await db.xPEvent.create({
    data: {
      userId: session.user.id,
      amount: 25,
      reason: "Analyzed resume with AI",
      source: "RESUME",
    },
  });
  await db.profile.updateMany({
    where: { userId: session.user.id },
    data: { xp: { increment: 25 } },
  });

  return NextResponse.json({
    resume: { id: resume.id, fileName: resume.fileName },
    analysis: {
      id: analysis.id,
      atsScore: aiResult.data.atsScore,
      keywords: aiResult.data.keywords,
      missingKeywords: aiResult.data.missingKeywords,
      issues: aiResult.data.issues,
      rewrites: aiResult.data.rewrites,
      summary: aiResult.data.summary,
      strengthAreas: aiResult.data.strengthAreas,
      improvementPriorities: aiResult.data.improvementPriorities,
    },
    source: aiResult.source,
  });
}
