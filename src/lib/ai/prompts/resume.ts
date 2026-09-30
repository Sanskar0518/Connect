export function buildResumeScreeningPrompt(params: {
  resumeText: string;
  targetRole?: string;
  targetCompany?: string;
  userSkills?: string[];
}): string {
  const { resumeText, targetRole = "Software Engineer", targetCompany, userSkills = [] } = params;

  return `You are an elite Applicant Tracking System (ATS) screening engine and senior tech recruiter.
Your mission is to perform dual tasks on the provided resume:
1. EXTRACT: Accurately extract all structured candidate information (name, contact info, links, summary, education, experience, projects, categorized skills).
2. SCREEN & EVALUATE: Provide an objective ATS compatibility score (0-100), identify match level, uncover critical gaps and missing role keywords, highlight strengths, and provide actionable bullet rewrites using Google/XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]").

TARGET EVALUATION:
- Target Role: "${targetRole}"
${targetCompany ? `- Target Company: "${targetCompany}"` : ""}
${userSkills.length > 0 ? `- Known Candidate Skills: ${userSkills.join(", ")}` : ""}

RESUME TEXT:
========================================
${resumeText.slice(0, 8000)}
========================================

INSTRUCTIONS:
- Ensure all extracted information is factual and strictly based on the resume text.
- If phone, links, location, or GPA are not mentioned, return null for those specific fields.
- Calculate an honest, realistic ATS score:
  * 80-100: Exceptional candidate with strong metrics, clear layout, relevant tech stack, and zero red flags.
  * 60-79: Solid candidate but missing quantified business impact, specific target keywords, or detailed project metrics.
  * <60: Needs major improvement, missing core sections, poor keyword alignment, or vague bullet points.
- Provide 2 to 4 high-impact actionable rewrites for weak bullets found in the resume.
- Categorize skills cleanly into technical (languages), frontend, backend, databasesAndCloud, and softSkills.
- Output MUST be valid JSON adhering strictly to the schema without any markdown formatting or outside text.`;
}

// Backward compatibility helper
export function buildResumeAnalysisPrompt(params: {
  resumeText: string;
  targetRole: string;
  targetCompany?: string;
  userSkills: string[];
}): string {
  return buildResumeScreeningPrompt(params);
}
