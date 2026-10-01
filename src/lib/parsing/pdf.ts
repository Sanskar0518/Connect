import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * PDF text extractor.
 * 1. Fast local pdf-parse extraction.
 * 2. If local extraction returns empty or <30 chars (e.g. Canva/Photoshop resumes, scanned PDFs,
 *    unsupported font encodings, or missing canvas workers in Next.js), invokes Google Gemini's
 *    multimodal document vision API.
 * 3. Text stream regex fallback.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Strategy 1: pdf-parse v2 class API (PDFParse)
  try {
    const pdfModule = await import("pdf-parse");
    const mod = pdfModule as Record<string, any>;
    const PDFParseClass = mod.PDFParse || (mod.default as Record<string, any>)?.PDFParse;
    if (PDFParseClass) {
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParseClass({ data: uint8 });
      const result = await parser.getText();
      if (result && typeof result.text === "string" && result.text.trim().length > 30) {
        return result.text.trim();
      }
    }
  } catch (err) {
    console.warn("PDFParse v2 local class extraction failed, trying multimodal:", err);
  }

  // Strategy 2: Google Gemini multimodal vision & document parser
  // Reads any PDF (text-based, vector, Canva designs, scanned image PDFs)
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
      ];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const res = await model.generateContent([
            {
              inlineData: {
                mimeType: "application/pdf",
                data: buffer.toString("base64"),
              },
            },
            "Extract all readable text from this resume/document thoroughly and verbatim. Include all candidate details, headings, work experience, bullets, dates, skills, and academic information. Output only the extracted text.",
          ]);

          const text = res.response.text();
          if (text && text.trim().length > 15) {
            return text.trim();
          }
        } catch (mErr) {
          console.warn(`Gemini PDF model '${modelName}' attempt failed:`, mErr);
        }
      }
    } catch (geminiErr) {
      console.warn("Gemini multimodal PDF extraction error:", geminiErr);
    }
  }

  // Strategy 3: pdf-parse v1 function API (legacy default export)
  try {
    const pdfModule = await import("pdf-parse");
    const mod = pdfModule as Record<string, any>;
    const fn =
      typeof pdfModule === "function"
        ? pdfModule
        : typeof mod.default === "function"
        ? mod.default
        : null;

    if (fn) {
      const result = await fn(buffer, { max: 50 });
      if (result && typeof result.text === "string" && result.text.trim().length > 30) {
        return result.text.trim();
      }
    }
  } catch (err) {
    console.warn("Legacy pdf-parse function extraction failed:", err);
  }

  // Strategy 4: Raw stream regex
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
