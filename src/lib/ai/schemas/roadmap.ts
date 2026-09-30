import { z } from "zod";

export const RoadmapNodeGenerationSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["TECHNICAL", "SYSTEM_DESIGN", "PROJECT", "SOFT_SKILL"]),
  level: z.number().int().min(1).max(5),
  estimatedHours: z.number().int().min(2).max(100),
  dependsOn: z.array(z.string()),
  targetSkills: z.array(z.string()),
  keyTakeaways: z.array(z.string()),
  suggestedTopics: z.array(z.string()),
});

export const RoadmapMilestoneSchema = z.object({
  level: z.number().int().min(1).max(5),
  milestoneTitle: z.string(),
  milestoneGoal: z.string(),
  nodes: z.array(RoadmapNodeGenerationSchema),
});

export const RoadmapGenerationResultSchema = z.object({
  trackSlug: z.string(),
  trackTitle: z.string(),
  summary: z.string(),
  totalEstimatedHours: z.number().int(),
  milestones: z.array(RoadmapMilestoneSchema).min(3).max(5),
});

export type RoadmapNodeGeneration = z.infer<typeof RoadmapNodeGenerationSchema>;
export type RoadmapMilestone = z.infer<typeof RoadmapMilestoneSchema>;
export type RoadmapGenerationResult = z.infer<typeof RoadmapGenerationResultSchema>;
