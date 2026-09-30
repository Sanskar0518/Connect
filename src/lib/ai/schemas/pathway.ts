import { z } from "zod";

export const PathwayItemSchema = z.object({
  trackSlug: z.string(),
  title: z.string(),
  category: z.string(),
  matchPercentage: z.number().min(0).max(100),
  avgSalary: z.string(),
  demandTrend: z.string(),
  fitReason: z.string(),
  criticalGaps: z.array(z.string()),
  estimatedTimeToReadiness: z.string(), // e.g. "2-3 months"
});

export const CareerPathwayRecommendationSchema = z.object({
  primaryTrack: PathwayItemSchema,
  alternativeTracks: z.array(PathwayItemSchema).min(1).max(3),
  overallAnalysis: z.string(),
});

export type PathwayItem = z.infer<typeof PathwayItemSchema>;
export type CareerPathwayRecommendation = z.infer<typeof CareerPathwayRecommendationSchema>;
