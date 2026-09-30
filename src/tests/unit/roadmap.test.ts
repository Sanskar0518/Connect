import { describe, it, expect } from "vitest";
import {
  CareerPathwayRecommendationSchema,
  PathwayItemSchema,
} from "@/lib/ai/schemas/pathway";
import {
  RoadmapGenerationResultSchema,
  RoadmapNodeGenerationSchema,
} from "@/lib/ai/schemas/roadmap";
import { buildPathwayRecommendationPrompt } from "@/lib/ai/prompts/pathway";
import { buildRoadmapGenerationPrompt } from "@/lib/ai/prompts/roadmap";

describe("Phase 3: Module 2 (AI Career Roadmap) Unit Tests", () => {
  describe("Pathway Schemas & Prompts (F3)", () => {
    it("validates a well-formed career pathway recommendation", () => {
      const validPathway = {
        primaryTrack: {
          trackSlug: "full-stack-web-developer",
          title: "Full Stack Web Developer",
          category: "Software Engineering",
          matchPercentage: 92,
          avgSalary: "$95,000 - $145,000",
          demandTrend: "+21% YoY",
          fitReason: "Direct match with your TypeScript and React coursework.",
          criticalGaps: ["Docker", "RESTful API Design"],
          estimatedTimeToReadiness: "2-3 months",
        },
        alternativeTracks: [
          {
            trackSlug: "backend-systems-engineer",
            title: "Backend Systems Engineer",
            category: "Software Engineering",
            matchPercentage: 84,
            avgSalary: "$105,000 - $160,000",
            demandTrend: "+19% YoY",
            fitReason: "Strong SQL and Python foundation.",
            criticalGaps: ["Redis", "Microservices"],
            estimatedTimeToReadiness: "3-4 months",
          },
          {
            trackSlug: "frontend-engineer",
            title: "Frontend Engineer",
            category: "Software Engineering",
            matchPercentage: 88,
            avgSalary: "$90,000 - $140,000",
            demandTrend: "+17% YoY",
            fitReason: "Excellent UI styling and component design skills.",
            criticalGaps: ["Tailwind CSS", "Testing"],
            estimatedTimeToReadiness: "1-2 months",
          },
        ],
        overallAnalysis: "Strong potential in full-stack engineering with fast turnaround.",
      };

      const parsed = CareerPathwayRecommendationSchema.safeParse(validPathway);
      expect(parsed.success).toBe(true);
    });

    it("rejects invalid match percentages outside [0, 100]", () => {
      const invalidItem = {
        trackSlug: "test",
        title: "Test Track",
        category: "Tech",
        matchPercentage: 110, // Invalid: > 100
        avgSalary: "100k",
        demandTrend: "+10%",
        fitReason: "Fit",
        criticalGaps: [],
        estimatedTimeToReadiness: "1m",
      };

      const parsed = PathwayItemSchema.safeParse(invalidItem);
      expect(parsed.success).toBe(false);
    });

    it("builds a comprehensive pathway recommendation prompt with student background", () => {
      const prompt = buildPathwayRecommendationPrompt({
        studentProfile: {
          name: "Alex Rivera",
          degree: "B.Tech CS",
          gpa: 3.82,
          targetRole: "Full Stack Developer",
          skills: [
            { name: "TypeScript", confidence: 0.9 },
            { name: "React", confidence: 0.85 },
          ],
        },
        missingSkills: ["Docker", "Kubernetes"],
        availableTracks: [
          {
            title: "Full Stack Web Developer",
            slug: "full-stack-web-developer",
            description: "Modern web apps",
            avgSalary: "$100k",
            demandTrend: "+20%",
            category: "SWE",
            requiredSkills: ["TypeScript", "React", "Docker"],
          },
        ],
      });

      expect(prompt).toContain("Alex Rivera");
      expect(prompt).toContain("TypeScript");
      expect(prompt).toContain("Full Stack Web Developer");
      expect(prompt).toContain("Docker");
    });
  });

  describe("Roadmap Schemas & Graph Validation (F9)", () => {
    it("validates a structured multi-level roadmap", () => {
      const sampleRoadmap = {
        trackSlug: "full-stack-web-developer",
        trackTitle: "Full Stack Web Developer",
        summary: "Step-by-step master plan.",
        totalEstimatedHours: 85,
        milestones: [
          {
            level: 1,
            milestoneTitle: "Phase 1: Foundations",
            milestoneGoal: "Solidify core language skills.",
            nodes: [
              {
                key: "node-ts-core",
                title: "Advanced TypeScript",
                description: "Deep dive into generics and narrowing.",
                category: "TECHNICAL",
                level: 1,
                estimatedHours: 20,
                dependsOn: [],
                targetSkills: ["TypeScript"],
                keyTakeaways: ["Generics", "Type guards"],
                suggestedTopics: ["Union types", "Discriminated unions"],
              },
            ],
          },
          {
            level: 2,
            milestoneTitle: "Phase 2: Full Stack Delivery",
            milestoneGoal: "Build complete client/server apps.",
            nodes: [
              {
                key: "node-nextjs",
                title: "Next.js App Architecture",
                description: "Server actions, caching, and SSR.",
                category: "TECHNICAL",
                level: 2,
                estimatedHours: 25,
                dependsOn: ["node-ts-core"],
                targetSkills: ["Next.js", "React"],
                keyTakeaways: ["RSC", "Route Handlers"],
                suggestedTopics: ["Caching strategies", "Streaming"],
              },
            ],
          },
          {
            level: 3,
            milestoneTitle: "Phase 3: Production Scale",
            milestoneGoal: "Deploy containerized applications.",
            nodes: [
              {
                key: "node-docker",
                title: "Docker Containerization",
                description: "Multi-stage builds and compose.",
                category: "SYSTEM_DESIGN",
                level: 3,
                estimatedHours: 20,
                dependsOn: ["node-nextjs"],
                targetSkills: ["Docker"],
                keyTakeaways: ["Container optimization", "Layer caching"],
                suggestedTopics: ["Dockerfile", "Compose"],
              },
            ],
          },
        ],
      };

      const parsed = RoadmapGenerationResultSchema.safeParse(sampleRoadmap);
      expect(parsed.success).toBe(true);
    });

    it("verifies node category enum adherence", () => {
      const invalidNode = {
        key: "n1",
        title: "Test",
        description: "Test",
        category: "INVALID_CAT", // Not allowed
        level: 1,
        estimatedHours: 10,
        dependsOn: [],
        targetSkills: [],
        keyTakeaways: [],
        suggestedTopics: [],
      };

      const parsed = RoadmapNodeGenerationSchema.safeParse(invalidNode);
      expect(parsed.success).toBe(false);
    });

    it("generates a structured roadmap prompt with core track competencies", () => {
      const prompt = buildRoadmapGenerationPrompt({
        track: {
          title: "DevOps & Cloud Engineer",
          slug: "devops-cloud-engineer",
          description: "Infrastructure automation",
          requiredSkills: ["Docker", "Kubernetes", "AWS"],
        },
        studentSkills: ["Linux", "Git"],
        missingSkills: ["Docker", "Kubernetes"],
      });

      expect(prompt).toContain("DevOps & Cloud Engineer");
      expect(prompt).toContain("Docker");
      expect(prompt).toContain("Kubernetes");
      expect(prompt).toContain("Linux");
    });
  });

  describe("Progress & Completion Calculations", () => {
    it("computes roadmap completion percentage correctly", () => {
      const computeProgress = (completed: number, total: number) =>
        total > 0 ? Math.round((completed / total) * 100) : 0;

      expect(computeProgress(0, 7)).toBe(0);
      expect(computeProgress(1, 4)).toBe(25);
      expect(computeProgress(3, 7)).toBe(43);
      expect(computeProgress(7, 7)).toBe(100);
      expect(computeProgress(0, 0)).toBe(0);
    });
  });
});
