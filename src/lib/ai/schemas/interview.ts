import { z } from "zod";

// ── F10: JD Intelligence ──────────────────────────────────────────────────────
export const JDIntelligenceSchema = z.object({
  role: z.string().describe("Extracted job title / role"),
  company: z.string().describe("Company name if mentioned, else 'Unknown'"),
  techStack: z
    .array(z.string())
    .describe("Technologies, frameworks, and tools mentioned"),
  softSkills: z
    .array(z.string())
    .describe("Soft skills and cultural values mentioned"),
  requiredExperience: z
    .string()
    .describe("Required years of experience or level"),
  keyThemes: z
    .array(z.string())
    .describe("Top 3–5 themes this company seems to value"),
  likelyQuestions: z.array(
    z.object({
      type: z
        .enum(["TECHNICAL", "BEHAVIORAL", "SITUATIONAL"])
        .describe("Question category"),
      question: z.string().describe("Likely interview question"),
      whyAsked: z
        .string()
        .describe("Why this question is likely based on the JD"),
      hint: z
        .string()
        .describe("Brief hint on how to answer well"),
    })
  ).describe("5–8 predicted interview questions based on this JD"),
  prepChecklist: z
    .array(z.string())
    .describe("Actionable prep tasks before the interview"),
});

// ── F6: Question Generator ────────────────────────────────────────────────────
export const QuestionSetSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string().describe("Unique question id (e.g. q1, q2)"),
      type: z.enum(["TECHNICAL", "BEHAVIORAL", "SITUATIONAL"]),
      question: z.string(),
      followUps: z
        .array(z.string())
        .describe("2–3 follow-up probes the interviewer might ask"),
      evaluationCriteria: z
        .string()
        .describe("What a strong answer must cover"),
    })
  ).describe("8–10 interview questions"),
});

// ── F6: Answer Evaluation ────────────────────────────────────────────────────
export const AnswerEvaluationSchema = z.object({
  contentScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Technical correctness and depth (0–10)"),
  clarityScore: z
    .number()
    .min(0)
    .max(10)
    .describe("How clearly the answer was communicated (0–10)"),
  structureScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Use of STAR or structured framework (0–10)"),
  confidenceScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Perceived confidence and conviction (0–10)"),
  feedback: z
    .string()
    .describe("Specific, actionable feedback paragraph for this answer"),
  strengths: z.array(z.string()).describe("What the candidate did well"),
  improvements: z
    .array(z.string())
    .describe("Specific things to improve in this answer"),
  suggestedAnswer: z
    .string()
    .describe("A model answer outline or key points they should have covered"),
  followUp: z
    .string()
    .describe("A single natural follow-up question to probe deeper"),
});

// ── F6: Session Feedback (end of interview) ───────────────────────────────────
export const SessionFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Final score out of 100"),
  contentScore: z.number().min(0).max(10),
  clarityScore: z.number().min(0).max(10),
  structureScore: z.number().min(0).max(10),
  confidenceScore: z.number().min(0).max(10),
  deliveryScore: z.number().min(0).max(10),
  fillerWordCount: z
    .number()
    .int()
    .describe("Estimated filler words (um, uh, like) across answers"),
  strengths: z.array(z.string()).describe("Top 3 overall strengths"),
  improvements: z.array(z.string()).describe("Top 3 improvement areas"),
  summary: z.string().describe("Overall performance narrative paragraph"),
  nextSteps: z
    .array(z.string())
    .describe("Concrete next steps to improve before next interview"),
});

export type JDIntelligence = z.infer<typeof JDIntelligenceSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
export type SessionFeedback = z.infer<typeof SessionFeedbackSchema>;
