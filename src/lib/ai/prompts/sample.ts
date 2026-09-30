export function buildSamplePrompt(studentRole: string, currentScore: number): string {
  return `Analyze the initial career readiness status for a student targeting the role "${studentRole}" with a starting readiness score of ${currentScore}/100.
Provide an operational health summary and three high-impact introductory insights on how they should kick off their learning roadmap.
Output strictly JSON matching this structure:
{
  "status": "healthy" | "operational" | "degraded",
  "service": "Connect Career Readiness Intelligence",
  "version": "1.0.0",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendedAction": "Actionable next step",
  "readinessScoreProjection": 75
}`;
}

export function sampleFallback(): {
  status: "operational";
  service: string;
  version: string;
  insights: string[];
  recommendedAction: string;
  readinessScoreProjection: number;
} {
  return {
    status: "operational",
    service: "Connect Career Readiness Intelligence",
    version: "1.0.0",
    insights: [
      "Talent profile established with foundational coursework and repository analysis.",
      "Identified critical industry competencies required for full-stack and software roles.",
      "Structured learning path mapped to top tech employer benchmarks.",
    ],
    recommendedAction: "Complete your skill profile by uploading a transcript or syllabus to unlock custom roadmap recommendations.",
    readinessScoreProjection: 75.0,
  };
}
