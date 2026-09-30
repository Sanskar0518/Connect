import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateStructuredOptions, AIResponse } from "./types";
import { generateContentHash, getCachedAIResult, setCachedAIResult } from "./cache";
import { retryWithCorrection } from "./retry";

/**
 * Attempts generation with Groq as an ultra-fast secondary/fallback LLM engine.
 */
async function generateWithGroq<T>(
  prompt: string,
  schema: import("zod").ZodType<T>,
  system?: string
): Promise<T | null> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return null;

  try {
    const systemPrompt =
      (system ? `${system}\n` : "") +
      "You are an AI career readiness assistant for students. Always respond strictly in valid JSON matching the requested schema without any markdown wrappers or outside commentary.";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn("Groq request failed with status:", res.status);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsedJson = JSON.parse(content);
    return schema.parse(parsedJson);
  } catch (err) {
    console.warn("Groq generation failed:", err);
    return null;
  }
}

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

  // 2. Try Gemini API
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use available gemini-flash-latest model
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction:
          (system ? `${system}\n` : "") +
          "You are an AI career readiness assistant for students. Always respond strictly in valid JSON matching the requested schema without any markdown wrappers or outside commentary.",
        generationConfig: {
          responseMimeType: "application/json",
          temperature,
        },
      });

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
    } catch (geminiError) {
      console.warn("Gemini generation failed, trying Groq fallback...", geminiError);
    }
  }

  // 3. Fallback to Groq API
  const groqResult = await generateWithGroq(prompt, schema, system);
  if (groqResult) {
    setCachedAIResult(effectiveCacheKey, groqResult);
    return {
      data: groqResult,
      source: "groq",
      confidence: 0.90,
    };
  }

  // 4. Deterministic Fallback
  if (fallback) {
    console.warn("Falling back to deterministic output.");
    const fallbackData = fallback();
    setCachedAIResult(effectiveCacheKey, fallbackData);
    return {
      data: fallbackData,
      source: "fallback",
      confidence: 0.8,
    };
  }

  throw new Error(
    "AI generation failed and no deterministic fallback was provided."
  );
}
