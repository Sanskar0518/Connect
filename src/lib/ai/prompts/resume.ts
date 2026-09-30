export function buildResumeAnalysisPrompt(params: {
  resumeText: string;
  targetRole: string;
  targetCompany?: string;
  userSkills: string[];
}): string {
  const { resumeText, targetRole, targetCompany, userSkills } = params;

  return `You are an expert ATS (Applicant Tracking System) specialist and career coach.

Analyze the following resume for a student targeting the role of "${targetRole}"${targetCompany ? ` at ${targetCompany}` : ""}.

**User's Known Skills:** ${userSkills.length ? userSkills.join(", ") : "Not specified"}

**Resume Content:**
---
${resumeText.slice(0, 4000)}
---

Provide a comprehensive ATS analysis including:
1. An ATS compatibility score (0-100) based on formatting, keyword density, structure, and content quality.
2. Keywords that are present and will help with ATS parsing.
3. Important missing keywords for "${targetRole}" roles.
4. Specific formatting or content issues (e.g., tables, graphics, missing sections, weak action verbs).
5. Up to 5 concrete bullet-point rewrites with before/after showing action-verb improvements.
6. A summary paragraph on overall resume strength.
7. Top 3 strengths and top 3 prioritized improvements.

Focus on actionable, specific advice. Be realistic with the score.`;
}
