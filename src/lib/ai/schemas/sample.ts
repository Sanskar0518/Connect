import { z } from "zod";

export const sampleHealthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "operational"]),
  service: z.string(),
  version: z.string(),
  insights: z.array(z.string()),
  recommendedAction: z.string(),
  readinessScoreProjection: z.number().min(0).max(100),
});

export type SampleHealthCheckResponse = z.infer<typeof sampleHealthCheckSchema>;
