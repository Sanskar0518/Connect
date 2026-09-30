import { describe, it, expect } from "vitest";
import { generateStructured } from "@/lib/ai/client";
import { z } from "zod";
import { sampleFallback } from "@/lib/ai/prompts/sample";

describe("AI Structured Generation Layer", () => {
  const testSchema = z.object({
    status: z.enum(["operational", "healthy", "degraded"]),
    service: z.string(),
    version: z.string(),
    insights: z.array(z.string()),
    recommendedAction: z.string(),
    readinessScoreProjection: z.number(),
  });

  it("returns validated fallback output when GEMINI_API_KEY is not set or network fails", async () => {
    const response = await generateStructured({
      prompt: "Test prompt",
      schema: testSchema,
      fallback: sampleFallback,
      cacheKey: "test-unit-fallback-key",
    });

    expect(response).toBeDefined();
    expect(response.source).toBe("fallback");
    expect(response.data.status).toBe("operational");
    expect(response.data.insights.length).toBeGreaterThan(0);
    expect(typeof response.data.readinessScoreProjection).toBe("number");
  });

  it("validates schema correctly and caches subsequent identical calls", async () => {
    const key = "test-cache-duplicate-key";
    const res1 = await generateStructured({
      prompt: "Cached prompt",
      schema: testSchema,
      fallback: sampleFallback,
      cacheKey: key,
    });

    const res2 = await generateStructured({
      prompt: "Cached prompt",
      schema: testSchema,
      fallback: sampleFallback,
      cacheKey: key,
    });

    expect(res1.data).toEqual(res2.data);
    expect(res2.source).toBe("cache");
  });
});
