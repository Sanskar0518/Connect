import { z } from "zod";

export async function retryWithCorrection<T>(
  fn: (previousError?: string) => Promise<string>,
  schema: z.ZodType<T>,
  maxRetries = 2
): Promise<{ data: T; retries: number }> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const rawText = await fn(lastError);
      
      // Clean JSON formatting if enclosed in markdown code fences
      const cleaned = rawText
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = schema.parse(parsed);

      return { data: validated, retries: attempt };
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        lastError = `Validation failed: ${err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}. Please output strictly valid JSON matching the schema.`;
      } else if (err instanceof SyntaxError) {
        lastError = `JSON syntax error: ${err.message}. Please return only raw valid JSON without explanatory prose.`;
      } else {
        lastError = err instanceof Error ? err.message : "Unknown error during AI generation";
      }

      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError}`);
      }
    }
  }

  throw new Error("Exhausted retries in AI generation");
}
