// F6: AI Mock Interview Simulator - Session Management
// GET  /api/interview/session - List past interview sessions and score trends
// POST /api/interview/session - Start a new mock interview session with generated or preloaded questions

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { QuestionSetSchema } from "@/lib/ai/schemas/interview";
import { buildQuestionGenerationPrompt } from "@/lib/ai/prompts/interview";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db.interviewSession.findMany({
    where: { userId: session.user.id },
    include: {
      feedback: true,
      turns: {
        orderBy: { turnNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const parsedSessions = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    companyId: s.companyId,
    jobDescription: s.jobDescription,
    status: s.status,
    createdAt: s.createdAt,
    turnsCount: s.turns.length,
    answeredTurnsCount: s.turns.filter((t) => !!t.answer).length,
    feedback: s.feedback
      ? {
          overallScore: s.feedback.overallScore,
          contentScore: s.feedback.contentScore,
          clarityScore: s.feedback.clarityScore,
          structureScore: s.feedback.structureScore,
          confidenceScore: s.feedback.confidenceScore,
          deliveryScore: s.feedback.deliveryScore,
          fillerWordCount: s.feedback.fillerWordCount,
          strengths: (() => {
            try {
              return JSON.parse(s.feedback.strengths);
            } catch {
              return [];
            }
          })(),
          improvements: (() => {
            try {
              return JSON.parse(s.feedback.improvements);
            } catch {
              return [];
            }
          })(),
        }
      : null,
  }));

  // Calculate historical trend for completed sessions
  const completedSessions = parsedSessions
    .filter((s) => s.status === "COMPLETED" && s.feedback)
    .reverse();

  const trendData = completedSessions.map((s, idx) => ({
    sessionNumber: idx + 1,
    title: s.title,
    date: new Date(s.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    overallScore: s.feedback?.overallScore || 0,
    contentScore: (s.feedback?.contentScore || 0) * 10,
    clarityScore: (s.feedback?.clarityScore || 0) * 10,
    structureScore: (s.feedback?.structureScore || 0) * 10,
    confidenceScore: (s.feedback?.confidenceScore || 0) * 10,
  }));

  const averageScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.feedback?.overallScore || 0), 0) /
            completedSessions.length
        )
      : 0;

  return NextResponse.json({
    sessions: parsedSessions,
    trend: trendData,
    stats: {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageScore,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    role = "Software Engineer",
    company = "Tech Company",
    companyId,
    type = "MIXED",
    jobDescription,
    preloadedQuestions,
  } = body as {
    title?: string;
    role?: string;
    company?: string;
    companyId?: string;
    type?: "TECHNICAL" | "BEHAVIORAL" | "MIXED";
    jobDescription?: string;
    preloadedQuestions?: Array<{
      type: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL";
      question: string;
      hint?: string;
      whyAsked?: string;
    }>;
  };

  // 1. Get user skills
  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    include: { skills: { include: { skill: true } } },
  });
  const userSkills = profile?.skills.map((ps) => ps.skill.name) ?? [];

  // 2. Fetch company techStack if companyId provided
  let techStack: string[] = [];
  let resolvedCompany = company;
  if (companyId) {
    const comp = await db.company.findUnique({ where: { id: companyId } });
    if (comp) {
      resolvedCompany = comp.name;
      try {
        techStack = JSON.parse(comp.techStack);
      } catch {
        techStack = [];
      }
    }
  }

  // 3. Obtain questions
  let finalQuestions: Array<{
    turnNumber: number;
    question: string;
  }> = [];

  if (preloadedQuestions && preloadedQuestions.length > 0) {
    finalQuestions = preloadedQuestions.slice(0, 5).map((q, idx) => ({
      turnNumber: idx + 1,
      question: q.question,
    }));
  } else {
    // Generate questions using AI
    const prompt = buildQuestionGenerationPrompt({
      role,
      company: resolvedCompany,
      interviewType: type,
      techStack,
      userSkills,
      jdSummary: jobDescription?.slice(0, 500),
    });

    const aiResult = await generateStructured({
      prompt,
      schema: QuestionSetSchema,
      system:
        "You are an engineering director and expert interview panel lead. Generate realistic, high-signal questions.",
      temperature: 0.35,
      cacheKey: `interview-questions:${role}:${resolvedCompany}:${type}`,
      fallback: () => ({
        questions: [
          {
            id: "q1",
            type: type === "BEHAVIORAL" ? "BEHAVIORAL" : "TECHNICAL",
            question:
              type === "BEHAVIORAL"
                ? "Tell me about a challenging technical project you worked on recently. What was your role and what hurdles did you overcome?"
                : "Walk me through how you would architect a scalable RESTful API with database caching and rate limiting.",
            followUps: [
              "What trade-offs did you consider?",
              "How would you measure success?",
            ],
            evaluationCriteria:
              "Clear technical articulation, trade-off awareness, and problem solving structure.",
          },
          {
            id: "q2",
            type: "TECHNICAL",
            question:
              "How does JavaScript's asynchronous event loop handle microtasks vs macrotasks, and why does it matter for UI responsiveness?",
            followUps: [
              "Can you give an example of Promise.resolve() vs setTimeout() execution order?",
              "How would you prevent long-running tasks from freezing the main thread?",
            ],
            evaluationCriteria:
              "Understanding of call stack, event loop, Promise resolution, and browser rendering cycle.",
          },
          {
            id: "q3",
            type: "BEHAVIORAL",
            question:
              "Describe a situation where you had a strong disagreement with a peer or team lead about an architectural decision. How did you resolve it?",
            followUps: [
              "What was the outcome?",
              "If you could do it over, would you change your approach?",
            ],
            evaluationCriteria:
              "STAR method adherence, constructive collaboration, and data-driven alignment.",
          },
          {
            id: "q4",
            type: "SITUATIONAL",
            question:
              "You discover a severe security flaw or high-severity memory leak in production right before a critical product launch. How do you triage and communicate?",
            followUps: [
              "Who do you notify first?",
              "How do you ensure it does not happen again?",
            ],
            evaluationCriteria:
              "Incident management, risk assessment, communication clarity, and preventative mindset.",
          },
        ],
      }),
    });

    finalQuestions = aiResult.data.questions.slice(0, 5).map((q, idx) => ({
      turnNumber: idx + 1,
      question: q.question,
    }));
  }

  // 4. Create InterviewSession in DB
  const sessionRecord = await db.interviewSession.create({
    data: {
      userId: session.user.id,
      title: title || `${resolvedCompany} - ${role} (${type.toLowerCase()} practice)`,
      type,
      companyId: companyId || null,
      jobDescription: jobDescription || null,
      status: "IN_PROGRESS",
      turns: {
        create: finalQuestions.map((q) => ({
          turnNumber: q.turnNumber,
          question: q.question,
        })),
      },
    },
    include: {
      turns: {
        orderBy: { turnNumber: "asc" },
      },
    },
  });

  return NextResponse.json({
    session: {
      id: sessionRecord.id,
      title: sessionRecord.title,
      type: sessionRecord.type,
      status: sessionRecord.status,
      createdAt: sessionRecord.createdAt,
    },
    turns: sessionRecord.turns,
    currentTurn: sessionRecord.turns[0],
    totalTurns: sessionRecord.turns.length,
  });
}
