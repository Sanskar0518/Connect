/**
 * AI prompts for skill gap analysis.
 */

export interface GapAnalysisInput {
  profileSkills: { name: string; confidence: number }[];
  requiredCompetencies: { skillName: string; importance: string; targetScore: number }[];
  targetRole: string;
  companyName?: string;
}

export function buildGapAnalysisPrompt(input: GapAnalysisInput): string {
  const profileSkillsStr = input.profileSkills
    .map((s) => `  - ${s.name} (confidence: ${Math.round(s.confidence * 100)}%)`)
    .join("\n");

  const requiredStr = input.requiredCompetencies
    .map((c) => `  - ${c.skillName} [${c.importance}, target: ${c.targetScore}%]`)
    .join("\n");

  return `You are a career readiness advisor performing a skill gap analysis for a student.

Target Role: ${input.targetRole}${input.companyName ? ` at ${input.companyName}` : ""}

Student's current skills:
${profileSkillsStr || "  (No skills recorded yet)"}

Required competencies for this role:
${requiredStr}

Analyze the gaps and return a JSON object with:
- "targetRole": the role name
- "matchedSkills": skills the student already has (array of { "skill": string, "confidence": number 0-1 })
- "missingSkills": skills the student lacks (array of { "skill": string, "severity": "Critical"|"Important"|"Nice-to-have", "reason": string explaining why it matters })
- "readinessPct": overall readiness percentage (0-100) as an integer
- "summary": a 1-2 sentence actionable summary for the student

Be honest but encouraging. Focus on actionable gaps. Return ONLY valid JSON.`;
}
