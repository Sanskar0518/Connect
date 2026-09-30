import { z } from "zod";

export const JobMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        jobId: z.string().describe("Job ID from the database"),
        matchScore: z
          .number()
          .min(0)
          .max(100)
          .describe("Overall match percentage 0-100"),
        skillOverlap: z
          .array(z.string())
          .describe("Skills the user has that match the job"),
        skillGaps: z
          .array(z.string())
          .describe("Job required skills the user is missing"),
        whyMatch: z
          .string()
          .describe("One-sentence explanation of why this is a good match"),
        applicationTip: z
          .string()
          .describe("Specific tip for the user to strengthen their application"),
      })
    )
    .describe("Ranked list of job matches with scores and insights"),
});

export type JobMatch = z.infer<typeof JobMatchSchema>;
