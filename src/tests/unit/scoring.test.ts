import { describe, it, expect } from "vitest";
import { computeReadinessScore, computeSkillCoverage } from "@/lib/scoring/readiness";

describe("computeReadinessScore", () => {
  it("computes weighted score correctly", () => {
    const score = computeReadinessScore({
      skillCoverage: 80,
      roadmapProgress: 60,
      resumeScore: 70,
      interviewScore: 50,
    });
    // 0.35*80 + 0.30*60 + 0.20*70 + 0.15*50 = 28 + 18 + 14 + 7.5 = 67.5 → 68
    expect(score).toBe(68);
  });

  it("clamps score to 100", () => {
    const score = computeReadinessScore({
      skillCoverage: 100,
      roadmapProgress: 100,
      resumeScore: 100,
      interviewScore: 100,
    });
    expect(score).toBe(100);
  });

  it("returns 0 for all-zero inputs", () => {
    expect(
      computeReadinessScore({
        skillCoverage: 0,
        roadmapProgress: 0,
        resumeScore: 0,
        interviewScore: 0,
      })
    ).toBe(0);
  });
});

describe("computeSkillCoverage", () => {
  const competencies = [
    { skillName: "TypeScript", importance: "Critical" },
    { skillName: "React", importance: "Critical" },
    { skillName: "Node.js", importance: "Important" },
    { skillName: "SQL", importance: "Important" },
    { skillName: "Docker", importance: "Nice-to-have" },
  ];

  it("returns 100% when all skills are present", () => {
    const skills = ["TypeScript", "React", "Node.js", "SQL", "Docker"];
    expect(computeSkillCoverage(skills, competencies)).toBe(100);
  });

  it("weights critical skills more heavily", () => {
    // Only TypeScript (Critical=3) covered out of total weight 3+3+2+2+1=11
    const coverage = computeSkillCoverage(["TypeScript"], competencies);
    // 3/11 = 27.27 → 27
    expect(coverage).toBe(27);
  });

  it("returns 0 for no matched skills", () => {
    expect(computeSkillCoverage([], competencies)).toBe(0);
  });

  it("returns 0 for empty competencies", () => {
    expect(computeSkillCoverage(["TypeScript", "React"], [])).toBe(0);
  });

  it("is case-insensitive", () => {
    const coverage = computeSkillCoverage(["typescript", "react"], competencies);
    // Both critical covered: 6/11 = 54.5 → 55
    expect(coverage).toBe(55);
  });
});
