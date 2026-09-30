import { z } from "zod";

export const ResumeAnalysisSchema = z.object({
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe("ATS compatibility score 0-100"),
  keywords: z.array(z.string()).describe("Keywords found in resume"),
  missingKeywords: z
    .array(z.string())
    .describe("Important keywords missing from resume for target role"),
  issues: z
    .array(z.string())
    .describe("Formatting or content issues found in the resume"),
  rewrites: z
    .array(
      z.object({
        section: z.string().describe("Section name e.g. Experience, Summary"),
        before: z.string().describe("Original bullet or text"),
        after: z.string().describe("Improved, action-verb driven rewrite"),
        reason: z.string().describe("Why this rewrite improves ATS score"),
      })
    )
    .describe("AI-suggested bullet-point rewrites"),
  summary: z
    .string()
    .describe("One-paragraph overall assessment of the resume strength"),
  strengthAreas: z
    .array(z.string())
    .describe("Top 3 strengths of the resume"),
  improvementPriorities: z
    .array(z.string())
    .describe("Top 3 areas to improve, ordered by impact"),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;
