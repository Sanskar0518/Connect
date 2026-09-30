import { z } from "zod";

export const GapAnalysisResultSchema = z.object({
  targetRole: z.string(),
  matchedSkills: z.array(
    z.object({
      skill: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
  missingSkills: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["Critical", "Important", "Nice-to-have"]),
      reason: z.string(),
    })
  ),
  readinessPct: z.number().min(0).max(100),
  summary: z.string(),
});

export type GapAnalysisResult = z.infer<typeof GapAnalysisResultSchema>;
