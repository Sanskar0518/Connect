import { z } from "zod";

export interface GenerateStructuredOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  system?: string;
  temperature?: number;
  cacheKey?: string;
  fallback?: () => T;
}

export interface AIResponse<T> {
  data: T;
  source: "gemini" | "groq" | "cache" | "fallback";
  confidence?: number;
  retries?: number;
}
