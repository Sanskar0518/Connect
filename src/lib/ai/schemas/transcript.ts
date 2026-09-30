import { z } from "zod";

export const TranscriptParseResultSchema = z.object({
  courses: z.array(
    z.object({
      name: z.string(),
      code: z.string().optional(),
      grade: z.string().optional(),
      credits: z.number().optional(),
      term: z.string().optional(),
    })
  ),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      url: z.string().optional(),
      role: z.string().optional(),
    })
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["TECHNICAL", "SOFT", "DOMAIN"]),
      confidence: z.number().min(0).max(1),
    })
  ),
  academicInfo: z.object({
    college: z.string().optional(),
    degree: z.string().optional(),
    graduationYear: z.number().optional(),
    gpa: z.number().optional(),
    headline: z.string().optional(),
  }),
});

export type TranscriptParseResult = z.infer<typeof TranscriptParseResultSchema>;
