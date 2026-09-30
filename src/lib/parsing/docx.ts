/**
 * DOCX text extractor using mammoth.
 */

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err) {
    console.error("DOCX parse error:", err);
    return "";
  }
}
