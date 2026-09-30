export function buildJobMatchPrompt(params: {
  userSkills: string[];
  targetRole: string;
  readinessPct: number;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    requirements: string[];
    description: string;
  }>;
}): string {
  const { userSkills, targetRole, readinessPct, jobs } = params;

  const jobsList = jobs
    .map(
      (j) =>
        `Job ID: ${j.id}\nTitle: ${j.title} at ${j.company}\nRequirements: ${j.requirements.join(", ")}\nDescription: ${j.description.slice(0, 200)}`
    )
    .join("\n\n");

  return `You are a career AI assistant helping a student find the best internship and job matches.

**Student Profile:**
- Target Role: ${targetRole}
- Readiness Score: ${readinessPct.toFixed(0)}%
- Current Skills: ${userSkills.join(", ") || "None listed"}

**Available Opportunities (analyze all of them):**
${jobsList}

For each job, compute a match score (0-100) based on skill alignment, role similarity, and readiness level.
Return ALL job IDs in the matches array, ranked by matchScore descending.
Provide specific skill overlap and gaps, a one-sentence match explanation, and a concrete application tip for each.`;
}
