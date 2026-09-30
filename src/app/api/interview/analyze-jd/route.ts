// F10: JD Intelligence
// POST /api/interview/analyze-jd  – extract tech stack, predicted questions, prep checklist

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { JDIntelligenceSchema } from "@/lib/ai/schemas/interview";
import { buildJDIntelligencePrompt } from "@/lib/ai/prompts/interview";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  let { jdText, targetRole, companyId } = body as {
    jdText?: string;
    targetRole?: string;
    companyId?: string;
  };

  let companyName = "Target Company";
  let companyCulture = "";
  let companyStack: string[] = [];

  if (companyId) {
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { benchmarks: true },
    });
    if (company) {
      companyName = company.name;
      companyCulture = company.culture || "";
      try {
        companyStack = JSON.parse(company.techStack);
      } catch {
        companyStack = [];
      }
      if (!targetRole && company.benchmarks.length > 0) {
        targetRole = company.benchmarks[0].role;
      }
      if (!jdText || jdText.trim().length < 20) {
        jdText = `Company: ${company.name}\nIndustry: ${company.industry}\nCulture and Values: ${company.culture}\nCore Tech Stack: ${companyStack.join(", ")}\nRole: ${targetRole || "Software Engineer"}\nDescription: ${company.description}\nSeeking candidates with strong computer science foundations, system design aptitude, and problem-solving abilities.`;
      }
    }
  }

  if (!jdText || jdText.trim().length < 20) {
    return NextResponse.json(
      { error: "Please provide a job description or select a company." },
      { status: 400 }
    );
  }

  // Fetch user skills
  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    include: { skills: { include: { skill: true } } },
  });
  const userSkills = profile?.skills.map((ps) => ps.skill.name) ?? [];

  const prompt = buildJDIntelligencePrompt({
    jdText,
    userSkills,
    targetRole: targetRole || profile?.targetRole || undefined,
  });

  const aiResult = await generateStructured({
    prompt,
    schema: JDIntelligenceSchema,
    system:
      "You are a senior technical recruiter and interview coach. Return only valid JSON.",
    temperature: 0.25,
    cacheKey: `jd-intel:${session.user.id}:${Buffer.from(jdText.slice(0, 300)).toString("base64")}`,
    fallback: () => ({
      role: targetRole || "Software Engineer",
      company: companyName,
      techStack: companyStack.length > 0 ? companyStack : ["TypeScript", "React", "Node.js", "PostgreSQL"],
      softSkills: ["Communication", "Problem solving", "Teamwork", "Ownership"],
      requiredExperience: "0–2 years",
      keyThemes: ["Scalability", "Reliability", "Continuous Improvement", "Execution Speed"],
      likelyQuestions: [
        {
          type: "TECHNICAL" as const,
          question: `Describe how you would design a high-throughput, low-latency API service using ${companyStack[0] || "TypeScript"} and modern databases.`,
          whyAsked: `Tests system design and database fundamentals critical for ${companyName}.`,
          hint: "Cover data schema, caching layer (Redis), indexing, horizontal scaling, and error handling.",
        },
        {
          type: "BEHAVIORAL" as const,
          question: `Tell me about a time you resolved an ambiguous technical requirement or disagreement with a teammate.`,
          whyAsked: `Aligns with the collaborative culture and ownership values emphasized at ${companyName}.`,
          hint: "Use STAR (Situation, Task, Action, Result). Highlight listening, data-driven decisions, and positive outcome.",
        },
        {
          type: "SITUATIONAL" as const,
          question: `If a critical service failed in production 15 minutes before a major demo, walk through your step-by-step mitigation strategy.`,
          whyAsked: `Tests operational readiness, incident triage, and poise under pressure.`,
          hint: "Prioritize rollback / blast radius containment, stakeholder communication, and post-mortem analysis.",
        },
        {
          type: "TECHNICAL" as const,
          question: `How do you approach performance profiling, query optimization, and memory leak diagnosis in modern web applications?`,
          whyAsked: `Tests practical debugging depth and production craftsmanship.`,
          hint: "Mention browser profiling tools, flamegraphs, DB explain plans, connection pooling, and monitoring.",
        },
      ],
      prepChecklist: [
        `Deep dive into ${companyName}'s engineering blog and open source projects`,
        "Prepare 3 STAR-method stories emphasizing ownership and cross-functional leadership",
        `Review core data structures, concurrency, and API contracts for ${companyStack.slice(0, 3).join(", ") || "core stack"}`,
        "Practice whiteboarding system architecture and edge case handling",
        "Prepare 3 insightful questions for the engineering manager and interview panel",
      ],
    }),
  });

  return NextResponse.json({
    intelligence: aiResult.data,
    source: aiResult.source,
  });
}
