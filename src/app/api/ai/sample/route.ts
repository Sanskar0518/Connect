import { NextResponse } from "next/server";
import { generateStructured } from "@/lib/ai/client";
import { sampleHealthCheckSchema } from "@/lib/ai/schemas/sample";
import { buildSamplePrompt, sampleFallback } from "@/lib/ai/prompts/sample";

export async function GET() {
  try {
    const prompt = buildSamplePrompt("Full Stack Web Developer", 68.5);
    const result = await generateStructured({
      prompt,
      schema: sampleHealthCheckSchema,
      system: "You are the Connect AI platform validator.",
      temperature: 0.1,
      fallback: sampleFallback,
      cacheKey: "sample-ai-health-check",
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Sample AI API error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
