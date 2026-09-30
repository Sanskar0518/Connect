// F6: Complete Session Evaluation
// POST /api/interview/session/[id]/finish – generate overall scorecard, persist feedback, award completion XP, update Readiness Score

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { SessionFeedbackSchema } from "@/lib/ai/schemas/interview";
import { buildSessionFeedbackPrompt } from "@/lib/ai/prompts/interview";
import { computeReadinessScore } from "@/lib/scoring/readiness";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch the session and its turns
  const interview = await db.interviewSession.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      turns: {
        orderBy: { turnNumber: "asc" },
      },
      feedback: true,
    },
  });

  if (!interview) {
    return NextResponse.json(
      { error: "Interview session not found." },
      { status: 404 }
    );
  }

  const answeredTurns = interview.turns.filter((t) => !!t.answer);
  if (answeredTurns.length === 0) {
    return NextResponse.json(
      { error: "No answered questions to evaluate in this session." },
      { status: 400 }
    );
  }

  // Calculate total filler words across answers
  let totalFillers = 0;
  const turnDataForPrompt = interview.turns.map((t) => {
    let parsedFeedbackText = "";
    if (t.feedback) {
      try {
        const parsed = JSON.parse(t.feedback);
        parsedFeedbackText = parsed.feedback || "";
        if (parsed.fillerWordsDetected) {
          totalFillers += parsed.fillerWordsDetected;
        }
      } catch {
        parsedFeedbackText = t.feedback;
      }
    }
    return {
      question: t.question,
      answer: t.answer || "No response provided",
      type: "QUESTION",
      feedback: parsedFeedbackText,
    };
  });

  // 2. Call AI Session Feedback
  const prompt = buildSessionFeedbackPrompt({
    role: interview.title,
    company: "Tech Company",
    interviewType: interview.type,
    turns: turnDataForPrompt,
  });

  const aiResult = await generateStructured({
    prompt,
    schema: SessionFeedbackSchema,
    system:
      "You are an executive engineering coach. Provide an objective, balanced end-of-interview report with actionable next steps.",
    temperature: 0.25,
    fallback: () => {
      const avgLength =
        answeredTurns.reduce((acc, t) => acc + (t.answer?.length || 0), 0) /
        answeredTurns.length;
      const baseScore = avgLength > 150 ? 82 : avgLength > 70 ? 74 : 65;

      return {
        overallScore: baseScore,
        contentScore: 8,
        clarityScore: 7.5,
        structureScore: 7,
        confidenceScore: 8,
        deliveryScore: 7.5,
        fillerWordCount: totalFillers || 4,
        strengths: [
          "Demonstrated solid conceptual foundations and accurate technical terminology",
          "Maintained composed, professional tone throughout all question turns",
          "Provided clear examples from academic and personal engineering projects",
        ],
        improvements: [
          "Structure behavioral examples more rigorously using STAR (Situation, Task, Action, Result)",
          "State architectural trade-offs (e.g. latency vs consistency, memory vs CPU) proactively",
          "Reduce reliance on filler phrasing when organizing complex thoughts",
        ],
        summary:
          "Strong overall performance with clear domain competency. The candidate communicated complex ideas effectively and stayed composed. Focusing on disciplined STAR structuring and trade-off justification will elevate responses to senior tier.",
        nextSteps: [
          "Revisit system design fundamentals: caching layers, database indexing, and async queues",
          "Practice 3 STAR stories focusing on measurable outcomes and conflict resolution",
          "Do a timed mock interview focusing on concise 2-minute answers",
        ],
      };
    },
  });

  const feedbackData = aiResult.data;

  // 3. Upsert InterviewFeedback
  const savedFeedback = await db.interviewFeedback.upsert({
    where: { sessionId: interview.id },
    create: {
      sessionId: interview.id,
      overallScore: feedbackData.overallScore,
      contentScore: feedbackData.contentScore,
      clarityScore: feedbackData.clarityScore,
      structureScore: feedbackData.structureScore,
      confidenceScore: feedbackData.confidenceScore,
      deliveryScore: feedbackData.deliveryScore,
      fillerWordCount: feedbackData.fillerWordCount || totalFillers,
      strengths: JSON.stringify(feedbackData.strengths),
      improvements: JSON.stringify(feedbackData.improvements),
    },
    update: {
      overallScore: feedbackData.overallScore,
      contentScore: feedbackData.contentScore,
      clarityScore: feedbackData.clarityScore,
      structureScore: feedbackData.structureScore,
      confidenceScore: feedbackData.confidenceScore,
      deliveryScore: feedbackData.deliveryScore,
      fillerWordCount: feedbackData.fillerWordCount || totalFillers,
      strengths: JSON.stringify(feedbackData.strengths),
      improvements: JSON.stringify(feedbackData.improvements),
    },
  });

  // 4. Mark session completed
  const updatedSession = await db.interviewSession.update({
    where: { id: interview.id },
    data: { status: "COMPLETED" },
  });

  // 5. Award Completion XP (+50 XP)
  try {
    await db.xPEvent.create({
      data: {
        userId: session.user.id,
        amount: 50,
        source: "INTERVIEW",
        reason: `Completed Mock Interview: ${interview.title} (Score: ${feedbackData.overallScore})`,
      },
    });
    await db.profile.update({
      where: { userId: session.user.id },
      data: { xp: { increment: 50 } },
    });
  } catch (err) {
    console.error("XP event creation non-critical error:", err);
  }

  // 6. Recalculate User Readiness Score
  try {
    const profile = await db.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: { include: { skill: true } },
      },
    });

    const gap = await db.gapAnalysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const totalNodes = await db.roadmapNode.count();
    const completedNodes = await db.nodeProgress.count({
      where: { userId: session.user.id, status: "DONE" },
    });
    const roadmapProgress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 50;

    const resumeAnalysis = await db.resumeAnalysis.findFirst({
      where: { resume: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
    });
    const resumeScore = resumeAnalysis ? resumeAnalysis.atsScore : 65;

    const skillCoverage = gap ? gap.readinessPct : 75;
    const interviewScore = feedbackData.overallScore;

    const newReadiness = computeReadinessScore({
      skillCoverage,
      roadmapProgress,
      resumeScore,
      interviewScore,
    });

    await db.profile.update({
      where: { userId: session.user.id },
      data: { readinessScore: newReadiness },
    });
  } catch (err) {
    console.error("Readiness update non-critical error:", err);
  }

  return NextResponse.json({
    session: updatedSession,
    feedback: {
      ...savedFeedback,
      strengths: feedbackData.strengths,
      improvements: feedbackData.improvements,
      summary: feedbackData.summary,
      nextSteps: feedbackData.nextSteps,
    },
    xpAwarded: 50,
  });
}
