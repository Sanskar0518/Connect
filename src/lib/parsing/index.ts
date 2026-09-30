/**
 * Document parser dispatcher — routes to PDF, DOCX, or TXT extractors based on MIME type or extension.
 */

import { extractTextFromPDF } from "./pdf";
import { extractTextFromDOCX } from "./docx";
import { extractTextFromTXT } from "./text";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/msword"
  | "application/octet-stream"
  | "text/plain"
  | "text/markdown";

export const ALLOWED_MIME_TYPES: SupportedMimeType[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/octet-stream",
  "text/plain",
  "text/markdown",
];

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md"];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  const lowerMime = (mimeType || "").toLowerCase();
  const lowerName = (fileName || "").toLowerCase();

  // 1. PDF
  if (
    lowerMime.includes("pdf") ||
    lowerName.endsWith(".pdf") ||
    buffer.subarray(0, 5).toString("latin1").startsWith("%PDF")
  ) {
    const text = await extractTextFromPDF(buffer);
    if (text.trim()) return text;
  }

  // 2. DOCX / Word
  if (
    lowerMime.includes("wordprocessingml") ||
    lowerMime.includes("docx") ||
    lowerMime.includes("msword") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc")
  ) {
    const text = await extractTextFromDOCX(buffer);
    if (text.trim()) return text;
  }

  // 3. Plain Text / Markdown
  if (
    lowerMime.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".json")
  ) {
    return extractTextFromTXT(buffer);
  }

  // Fallback 4: Try UTF-8 decode
  const asText = buffer.toString("utf-8");
  if (asText.trim().length > 20 && !asText.includes("\u0000")) {
    return asText;
  }

  // Fallback 5: Try PDF extractor if nothing else matched
  const fallbackPdf = await extractTextFromPDF(buffer);
  if (fallbackPdf.trim()) return fallbackPdf;

  throw new Error(`Unsupported or unreadable file format: ${mimeType || fileName}`);
}
