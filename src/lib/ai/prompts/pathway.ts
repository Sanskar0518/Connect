export interface PathwayPromptInput {
  studentProfile: {
    name?: string;
    headline?: string;
    degree?: string;
    college?: string;
    gpa?: number;
    targetRole?: string;
    skills: { name: string; category?: string; confidence?: number }[];
  };
  missingSkills?: string[];
  availableTracks: {
    title: string;
    slug: string;
    description: string;
    avgSalary: string;
    demandTrend: string;
    category: string;
    requiredSkills: string[];
  }[];
}

export function buildPathwayRecommendationPrompt(input: PathwayPromptInput): string {
  const { studentProfile, missingSkills = [], availableTracks } = input;

  return `You are Connect's Career Advisory AI Engine.
Analyze the following student's academic background, existing skills, and career interests, and compare them against the available career tracks.

STUDENT PROFILE:
- Student Name: ${studentProfile.name || "Student"}
- Target Role / Interest: ${studentProfile.targetRole || "Software Engineering"}
- Degree / Academic Background: ${studentProfile.degree || "Computer Science"} (${studentProfile.college || "University"})
- GPA: ${studentProfile.gpa || "N/A"}
- Existing Verified Skills: ${studentProfile.skills.map((s) => s.name).join(", ") || "None"}
- Identified Missing Skills / Gaps: ${missingSkills.join(", ") || "None specified"}

AVAILABLE CAREER TRACKS:
${availableTracks
  .map(
    (t) => `• Track: "${t.title}" (slug: "${t.slug}", category: "${t.category}")
   Salary: ${t.avgSalary} | Growth Trend: ${t.demandTrend}
   Description: ${t.description}
   Required Competencies: ${t.requiredSkills.join(", ")}`
  )
  .join("\n\n")}

CRITICAL INSTRUCTIONS:
1. Select the SINGLE BEST PRIMARY TRACK that aligns closest with the student's existing strengths and target goals.
2. Select 2 ALTERNATIVE TRACKS that represent viable pivots or adjacent high-growth opportunities.
3. For each track, compute a realistic matchPercentage (0 to 100) based on overlapping skills.
4. List the criticalGaps (competencies the student needs to learn for that specific track).
5. State an estimatedTimeToReadiness (e.g. "2-3 months", "3-5 months").
6. Provide a concise, actionable fitReason explaining why this pathway makes sense.
7. Provide an overallAnalysis summarizing the student's trajectory.
8. Ground your recommendation strictly in the provided available career tracks (use the exact slug and title).`;
}
