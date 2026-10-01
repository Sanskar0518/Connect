export function buildResumeScreeningPrompt(params: {
  resumeText: string;
  targetRole?: string;
  targetCompany?: string;
  userSkills?: string[];
}): string {
  const { resumeText, targetRole = "Software Engineer", targetCompany, userSkills = [] } = params;

  return `You are an elite Applicant Tracking System (ATS) screening engine and senior talent extraction specialist.
Your mission is to analyze the candidate's resume against the target role and output strictly valid JSON matching the exact schema below.

TARGET ROLE: "${targetRole}"
${targetCompany ? `TARGET COMPANY: "${targetCompany}"` : ""}
${userSkills.length > 0 ? `CANDIDATE KNOWN SKILLS: ${userSkills.join(", ")}` : ""}

RESUME CONTENT:
========================================
${resumeText.slice(0, 8000)}
========================================

EXPECTED JSON SCHEMA FORMAT:
{
  "candidate": {
    "name": "Candidate Full Name",
    "email": "email or null",
    "phone": "phone or null",
    "location": "location or null",
    "summary": "Concise professional summary",
    "links": {
      "github": "url or null",
      "linkedin": "url or null",
      "portfolio": "url or null"
    }
  },
  "education": [
    {
      "degree": "Degree and major",
      "institution": "University / College name",
      "year": "Graduation year or dates",
      "gpa": "GPA or null"
    }
  ],
  "experience": [
    {
      "role": "Position Title",
      "company": "Company Name",
      "period": "Start - End Date",
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["Tech 1", "Tech 2"],
      "description": "Short project description",
      "highlights": ["Key feature or impact"],
      "link": "url or null"
    }
  ],
  "skills": {
    "technical": ["Languages e.g. TypeScript, Python, Java, SQL"],
    "frontend": ["React", "Next.js", "Tailwind CSS"],
    "backend": ["Node.js", "Express", "REST APIs"],
    "databasesAndCloud": ["PostgreSQL", "Supabase", "Docker", "AWS"],
    "softSkills": ["Problem Solving", "Collaboration", "Agile"]
  },
  "atsScreening": {
    "atsScore": 78,
    "matchLevel": "Good Match",
    "summary": "2-3 sentences evaluating candidate match, strengths and growth areas for target role.",
    "strengths": ["Clear strength 1", "Clear strength 2", "Clear strength 3"],
    "criticalGaps": ["Area to improve 1", "Missing qualification or metric 2"],
    "missingKeywords": ["Target keyword 1", "Target keyword 2", "Target keyword 3"],
    "recommendedRoles": ["${targetRole}", "Related Role 2"],
    "actionableRewrites": [
      {
        "section": "Experience",
        "before": "Original bullet from resume text",
        "after": "High-impact rewrite following Google formula: Accomplished [X] measured by [Y] doing [Z]",
        "reason": "Uses action verb and quantified outcome to increase ATS match"
      }
    ]
  }
}

CRITICAL RULES:
- Output MUST be valid JSON only. Do not wrap in markdown quotes or preface with any commentary.
- matchLevel MUST be one of: "Strong Match", "Good Match", "Moderate Match", or "Needs Improvement".
- Every item in actionableRewrites MUST be an object with "section", "before", "after", and "reason".
- atsScore MUST be an integer between 0 and 100 based on keyword density, metrics, experience, and role alignment.`;
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

