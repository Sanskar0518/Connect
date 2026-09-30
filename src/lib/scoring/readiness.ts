/**
 * Scoring utilities (pure, unit-tested).
 * readiness.ts — computes overall Readiness Score from sub-component scores.
 */

export interface ReadinessComponents {
  /** 0–100: Skill coverage vs. target role requirements */
  skillCoverage: number;
  /** 0–100: Roadmap nodes completed */
  roadmapProgress: number;
  /** 0–100: Resume ATS score */
  resumeScore: number;
  /** 0–100: Interview session score */
  interviewScore: number;
}

/**
 * Weighted readiness formula from architecture.md:
 *   score = 0.35 * skillCoverage + 0.30 * roadmapProgress + 0.20 * resumeScore + 0.15 * interviewScore
 */
export function computeReadinessScore(components: ReadinessComponents): number {
  const score =
    0.35 * components.skillCoverage +
    0.30 * components.roadmapProgress +
    0.20 * components.resumeScore +
    0.15 * components.interviewScore;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Compute skill coverage percentage.
 * Matched skills weighted by importance:
 *   Critical = 3, Important = 2, Nice-to-have = 1
 */
export function computeSkillCoverage(
  profileSkillNames: string[],
  requiredCompetencies: { skillName: string; importance: string }[]
): number {
  if (requiredCompetencies.length === 0) return 0;

  const profileSet = new Set(profileSkillNames.map((s) => s.toLowerCase()));

  const weights: Record<string, number> = {
    Critical: 3,
    Important: 2,
    "Nice-to-have": 1,
  };

  let totalWeight = 0;
  let coveredWeight = 0;

  for (const comp of requiredCompetencies) {
    const w = weights[comp.importance] ?? 1;
    totalWeight += w;
    if (profileSet.has(comp.skillName.toLowerCase())) {
      coveredWeight += w;
    }
  }

  return totalWeight === 0 ? 0 : Math.round((coveredWeight / totalWeight) * 100);
}
