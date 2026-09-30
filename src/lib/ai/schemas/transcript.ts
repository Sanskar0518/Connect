import { z } from "zod";

export const TranscriptParseResultSchema = z.object({
  courses: z
    .array(
      z.object({
        name: z.string(),
        code: z.string().nullish(),
        grade: z.string().nullish(),
        credits: z.union([z.number(), z.string().transform((v) => parseFloat(v) || undefined)]).nullish(),
        term: z.string().nullish(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().default(""),
        technologies: z.array(z.string()).default([]),
        url: z.string().nullish(),
        role: z.string().nullish(),
      })
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: z
          .enum(["TECHNICAL", "SOFT", "DOMAIN"])
          .or(z.string().transform((v) => {
            const u = v.toUpperCase();
            if (u.includes("SOFT")) return "SOFT";
            if (u.includes("DOMAIN")) return "DOMAIN";
            return "TECHNICAL";
          }))
          .default("TECHNICAL"),
        confidence: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0.85)]).default(0.85),
      })
    )
    .default([]),
  academicInfo: z
    .object({
      college: z.string().nullish(),
      degree: z.string().nullish(),
      graduationYear: z
        .union([z.number(), z.string().transform((v) => parseInt(v.replace(/\D/g, ""), 10) || undefined)])
        .nullish(),
      gpa: z
        .union([z.number(), z.string().transform((v) => parseFloat(v.replace(/[^0-9.]/g, "")) || undefined)])
        .nullish(),
      headline: z.string().nullish(),
    })
    .default({}),
});

export type TranscriptParseResult = z.infer<typeof TranscriptParseResultSchema>;
