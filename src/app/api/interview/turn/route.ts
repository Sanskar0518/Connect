// F6: Answer Evaluation per turn
// POST /api/interview/turn  – evaluate candidate answer, give instant feedback, award XP

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import { AnswerEvaluationSchema } from "@/lib/ai/schemas/interview";
import { buildAnswerEvaluationPrompt } from "@/lib/ai/prompts/interview";

// Heuristic filler word detector
function countFillerWords(text: string): number {
  const fillerRegex = /\b(um|uh|erm|like|you know|basically|actually|literally|sort of|kind of|so yeah)\b/gi;
  const matches = text.match(fillerRegex);
  return matches ? matches.length : 0;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    sessionId,
    turnNumber,
    answer,
    questionType = "TECHNICAL",
  } = body as {
    sessionId: string;
    turnNumber: number;
    answer: string;
    questionType?: string;
  };

  if (!sessionId || turnNumber === undefined || !answer) {
    return NextResponse.json(
      { error: "sessionId, turnNumber, and answer are required." },
      { status: 400 }
    );
  }

  // 1. Verify session
  const interview = await db.interviewSession.findFirst({
    where: {
      id: sessionId,
      userId: session.user.id,
    },
    include: {
      turns: {
        orderBy: { turnNumber: "asc" },
      },
    },
  });

  if (!interview) {
    return NextResponse.json(
      { error: "Interview session not found." },
      { status: 404 }
    );
  }

  const currentTurn = interview.turns.find((t) => t.turnNumber === turnNumber);
  if (!currentTurn) {
    return NextResponse.json(
      { error: `Turn number ${turnNumber} not found in this session.` },
      { status: 404 }
    );
  }

  const fillers = countFillerWords(answer);

  // 2. AI Answer Evaluation
  const prompt = buildAnswerEvaluationPrompt({
    question: currentTurn.question,
    questionType,
    answer,
    role: interview.title || "Software Engineer",
    turnNumber,
  });

  const aiResult = await generateStructured({
    prompt,
    schema: AnswerEvaluationSchema,
    system:
      "You are a strict but encouraging tech interview evaluator. Provide actionable scoring, strengths, improvements, and model answer.",
    temperature: 0.25,
    fallback: () => {
      const isDetailed = answer.length > 120;
      return {
        contentScore: isDetailed ? 8 : 6,
        clarityScore: 7,
        structureScore: isDetailed ? 8 : 5,
        confidenceScore: 7,
        feedback: isDetailed
          ? "Good articulation of the core concepts with specific examples. Consider structuring behavioral responses even more tightly with the STAR framework (Situation, Task, Action, Result)."
          : "Solid starting point, but your response would benefit from deeper technical specifics, mention of trade-offs, and measurable outcomes.",
        strengths: [
          "Directly addressed the prompt without avoiding the question",
          isDetailed ? "Included concrete examples from hands-on experience" : "Maintained concise and clear language",
        ],
        improvements: [
          "Explicitly state trade-offs and alternative approaches considered",
          "Quantify the results or impact achieved where applicable",
        ],
        suggestedAnswer:
          "Start with a high-level thesis or architecture diagram summary. Break down into components (API contract, data model, caching strategy, error handling), and conclude with observability and scalability considerations.",
        followUp:
          "How would your approach adapt if the system's traffic grew 10x overnight or if network latency spiked between data centers?",
      };
    },
  });

  const evaluation = {
    ...aiResult.data,
    fillerWordsDetected: fillers,
  };

  // 3. Update the Turn
  const updatedTurn = await db.interviewTurn.update({
    where: { id: currentTurn.id },
    data: {
      answer,
      feedback: JSON.stringify(evaluation),
    },
  });

  // 4. Award XP for answering
  try {
    await db.xPEvent.create({
      data: {
        userId: session.user.id,
        amount: 15,
        source: "INTERVIEW",
        reason: `Answered Question #${turnNumber} in ${interview.title}`,
      },
    });
    await db.profile.update({
      where: { userId: session.user.id },
      data: { xp: { increment: 15 } },
    });
  } catch (err) {
    console.error("XP update non-critical error:", err);
  }

  // 5. Check next turn
  const nextTurn = interview.turns.find((t) => t.turnNumber === turnNumber + 1);

  return NextResponse.json({
    turn: {
      ...updatedTurn,
      feedback: evaluation,
    },
    evaluation,
    nextTurn: nextTurn || null,
    isLastTurn: !nextTurn,
    fillerWordsDetected: fillers,
    xpAwarded: 15,
  });
}
