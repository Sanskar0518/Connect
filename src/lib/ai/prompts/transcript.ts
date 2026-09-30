/**
 * AI prompts for transcript parsing.
 * All prompts are typed functions — no inline strings in routes.
 */

export function buildTranscriptParsePrompt(documentText: string): string {
  return `You are an academic transcript and project portfolio parser.

Analyze the following academic document text and extract:

1. **courses**: All subjects/courses with name, code, grade, credits, term.
2. **projects**: Any mentioned projects with title, description, technologies used (array of strings), URL if present, student's role.
3. **skills**: All technical, soft, and domain skills implied by the courses and projects. Estimate a confidence score (0.0–1.0) based on the depth of engagement (grade, number of courses, projects using that skill).
4. **academicInfo**: Institution name, degree program, graduation year, GPA if present, and a one-line professional headline.

Return ONLY a valid JSON object matching this schema:
{
  "courses": [{ "name": string, "code": string?, "grade": string?, "credits": number?, "term": string? }],
  "projects": [{ "title": string, "description": string, "technologies": string[], "url": string?, "role": string? }],
  "skills": [{ "name": string, "category": "TECHNICAL" | "SOFT" | "DOMAIN", "confidence": number }],
  "academicInfo": { "college": string?, "degree": string?, "graduationYear": number?, "gpa": number?, "headline": string? }
}

Document text:
---
${documentText.slice(0, 12000)}
---`;
}
