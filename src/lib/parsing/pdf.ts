/**
 * PDF text extractor using pdf-parse.
 * Returns raw text from the first 50 pages.
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule = await import("pdf-parse");
    const fn =
      typeof pdfParseModule === "function"
        ? pdfParseModule
        : (pdfParseModule as unknown as { default: (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string }> }).default;
    const result = await fn(buffer, { max: 50 });
    return result.text || "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}
