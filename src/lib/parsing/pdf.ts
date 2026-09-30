/**
 * PDF text extractor using pdf-parse.
 * Supports both pdf-parse v2 (class-based API) and v1 (function-based API).
 * Returns raw extracted text from the PDF buffer.
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Strategy 1: pdf-parse v2 class API (PDFParse)
  try {
    const pdfModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFParseClass = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse;
    if (PDFParseClass) {
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParseClass({ data: uint8 });
      const result = await parser.getText();
      if (result && typeof result.text === "string" && result.text.trim()) {
        return result.text.trim();
      }
    }
  } catch (err) {
    console.warn("PDFParse v2 class extraction failed, trying legacy fallback:", err);
  }

  // Strategy 2: pdf-parse v1 function API (default export)
  try {
    const pdfModule = await import("pdf-parse");
    const fn =
      typeof pdfModule === "function"
        ? pdfModule
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (pdfModule as any).default === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pdfModule as any).default
        : null;

    if (fn) {
      const result = await fn(buffer, { max: 50 });
      if (result && typeof result.text === "string" && result.text.trim()) {
        return result.text.trim();
      }
    }
  } catch (err) {
    console.warn("Legacy pdf-parse function extraction failed:", err);
  }

  // Strategy 3: Text stream extraction fallback for text-based uncompressed PDFs
  try {
    const raw = buffer.toString("latin1");
    const textPieces: string[] = [];
    const textRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = textRegex.exec(raw)) !== null) {
      if (match[1] && match[1].trim()) {
        textPieces.push(match[1]);
      }
    }
    if (textPieces.length > 5) {
      return textPieces.join(" ");
    }
  } catch (rawErr) {
    console.warn("Raw PDF text stream extraction failed:", rawErr);
  }

  return "";
}
