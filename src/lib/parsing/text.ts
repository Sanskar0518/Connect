/**
 * Plain-text extractor — UTF-8 decode.
 */

export function extractTextFromTXT(buffer: Buffer): string {
  return buffer.toString("utf-8");
}
