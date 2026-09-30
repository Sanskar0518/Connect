import { describe, it, expect } from "vitest";
import { skillProvider } from "@/lib/adapters/skills";
import { jobProvider } from "@/lib/adapters/jobs";
import { govProvider } from "@/lib/adapters/gov";
import { scholarshipProvider } from "@/lib/adapters/scholarships";

describe("Seed Adapters", () => {
  it("SkillFrameworkProvider returns competencies for a role", async () => {
    const competencies = await skillProvider.getRoleCompetencies("Full Stack");
    expect(competencies).toBeDefined();
    expect(competencies.length).toBeGreaterThan(0);
    expect(competencies[0]).toHaveProperty("skillName");
    expect(competencies[0]).toHaveProperty("category");
    expect(competencies[0]).toHaveProperty("importance");
  });

  it("JobProvider returns job listings with requirements", async () => {
    const jobs = await jobProvider.search({ limit: 5 });
    expect(jobs).toBeDefined();
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs[0]).toHaveProperty("title");
    expect(jobs[0]).toHaveProperty("company");
    expect(jobs[0].requirements).toBeInstanceOf(Array);
  });

  it("GovFeedProvider returns opportunities", async () => {
    const opportunities = await govProvider.list({});
    expect(opportunities).toBeDefined();
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities[0]).toHaveProperty("title");
    expect(opportunities[0]).toHaveProperty("department");
  });

  it("ScholarshipProvider returns scholarship listings with checklists", async () => {
    const scholarships = await scholarshipProvider.list({});
    expect(scholarships).toBeDefined();
    expect(scholarships.length).toBeGreaterThan(0);
    expect(scholarships[0]).toHaveProperty("amount");
    expect(scholarships[0].checklist).toBeInstanceOf(Array);
  });
});
