/**
 * PDF text extractor using pdf-parse.
 * Returns raw text from the first 50 pages.
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const fn = typeof pdfParse === "function" ? pdfParse : pdfParse.default;
    const result = await fn(buffer, { max: 50 });
    return result.text || "";
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}
