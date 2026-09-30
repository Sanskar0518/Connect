/**
 * Document parser dispatcher — routes to PDF, DOCX, or TXT extractors based on MIME type.
 */

import { extractTextFromPDF } from "./pdf";
import { extractTextFromDOCX } from "./docx";
import { extractTextFromTXT } from "./text";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain";

export const ALLOWED_MIME_TYPES: SupportedMimeType[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf":
      return extractTextFromPDF(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractTextFromDOCX(buffer);
    case "text/plain":
      return extractTextFromTXT(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
