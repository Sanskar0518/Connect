import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateStructuredOptions, AIResponse } from "./types";
import { generateContentHash, getCachedAIResult, setCachedAIResult } from "./cache";
import { retryWithCorrection } from "./retry";

export async function generateStructured<T>(
  options: GenerateStructuredOptions<T>
): Promise<AIResponse<T>> {
  const { prompt, schema, system, temperature = 0.2, cacheKey, fallback } = options;

  // 1. Check Cache
  const effectiveCacheKey = cacheKey || generateContentHash(prompt + (system || ""));
  const cached = getCachedAIResult<T>(effectiveCacheKey);
  if (cached) {
    return { data: cached, source: "cache", confidence: 0.95 };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // 2. Check for missing API Key and use fallback
  if (!apiKey) {
    if (fallback) {
      const fallbackData = fallback();
      setCachedAIResult(effectiveCacheKey, fallbackData);
      return { data: fallbackData, source: "fallback", confidence: 0.85 };
    }
    throw new Error(
      "GEMINI_API_KEY is not configured and no deterministic fallback was provided."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Default to fast, stable gemini-1.5-flash
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      (system ? `${system}\n` : "") +
      "You are an AI career readiness assistant for students. Always respond strictly in valid JSON matching the requested schema without any markdown wrappers or outside commentary.",
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
    },
  });

  try {
    const { data, retries } = await retryWithCorrection<T>(
      async (previousError) => {
        let currentPrompt = prompt;
        if (previousError) {
          currentPrompt += `\n\n[CORRECTION REQUIRED]: Your previous output had an issue: ${previousError}`;
        }
        const result = await model.generateContent(currentPrompt);
        return result.response.text();
      },
      schema,
      2
    );

    // Save to Cache
    setCachedAIResult(effectiveCacheKey, data);

    return {
      data,
      source: "gemini",
      confidence: 0.92,
      retries,
    };
  } catch (error) {
    console.error("AI Generation failed:", error);
    if (fallback) {
      console.warn("Falling back to deterministic output due to AI generation error.");
      return {
        data: fallback(),
        source: "fallback",
        confidence: 0.8,
      };
    }
    throw error;
  }
}
