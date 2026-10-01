import { z } from "zod";

// Candidate info extracted from resume
export const CandidateInfoSchema = z.object({
  name: z.string().default("Candidate").describe("Candidate full name"),
  email: z.string().nullable().optional().describe("Email address"),
  phone: z.string().nullable().optional().describe("Phone number"),
  location: z.string().nullable().optional().describe("City, State or Country"),
  summary: z.string().nullable().optional().describe("Professional summary or career objective"),
  links: z
    .object({
      github: z.string().nullable().optional(),
      linkedin: z.string().nullable().optional(),
      portfolio: z.string().nullable().optional(),
    })
    .default({}),
});

// Education history
export const EducationItemSchema = z.object({
  degree: z.string().describe("Degree name e.g. B.Tech in Computer Science"),
  institution: z.string().describe("University or College name"),
  year: z.string().nullable().optional().describe("Graduation year or date range"),
  gpa: z.string().nullable().optional().describe("GPA or percentage if listed"),
});

// Experience history
export const ExperienceItemSchema = z.object({
  role: z.string().describe("Job title or internship role"),
  company: z.string().describe("Company or organization name"),
  period: z.string().nullable().optional().describe("Duration e.g. 2023 - Present"),
  highlights: z.array(z.string()).default([]).describe("Key bullet points or achievements"),
});

// Project history
export const ProjectItemSchema = z.object({
  name: z.string().describe("Project title"),
  technologies: z.array(z.string()).default([]).describe("Technologies / languages used"),
  description: z.string().nullable().optional().describe("Brief description of the project"),
  highlights: z.array(z.string()).default([]).describe("Key accomplishments or metrics"),
  link: z.string().nullable().optional().describe("GitHub or live link if found"),
});

// Categorized Skills
export const CategorizedSkillsSchema = z.object({
  technical: z.array(z.string()).default([]).describe("Core programming languages e.g. TypeScript, Python"),
  frontend: z.array(z.string()).default([]).describe("Frontend tech e.g. React, Next.js, CSS"),
  backend: z.array(z.string()).default([]).describe("Backend tech e.g. Node.js, Express, Go, REST APIs"),
  databasesAndCloud: z.array(z.string()).default([]).describe("Databases & Cloud e.g. PostgreSQL, Supabase, Docker, AWS"),
  softSkills: z.array(z.string()).default([]).describe("Soft skills or domain practices e.g. Agile, Problem Solving"),
});

// Actionable Bullet Rewrites
export const ResumeRewriteSchema = z.union([
  z.object({
    section: z.string().default("Experience").describe("Section name e.g. Experience, Summary, Projects"),
    before: z.string().default("Original resume point").describe("Original bullet or text"),
    after: z.string().default("").describe("Action-verb driven, metric-oriented rewrite"),
    reason: z.string().default("Uses action verb and quantified outcome to increase ATS match").describe("Why this rewrite improves ATS score"),
  }),
  z.string().transform((str) => ({
    section: "Experience",
    before: "Original bullet from resume",
    after: str,
    reason: "Action-oriented metric rewrite to improve ATS ranking",
  })),
]);

export type ResumeRewrite = {
  section: string;
  before: string;
  after: string;
  reason: string;
};

// Complete Resume Screening & Extraction Schema
export const ResumeScreeningSchema = z.object({
  candidate: CandidateInfoSchema.default({ name: "Candidate", links: {} }),
  education: z.array(EducationItemSchema).default([]),
  experience: z.array(ExperienceItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  skills: CategorizedSkillsSchema.default({
    technical: [],
    frontend: [],
    backend: [],
    databasesAndCloud: [],
    softSkills: [],
  }),
  atsScreening: z.object({
    atsScore: z.number().min(0).max(100).default(75).describe("ATS compatibility score 0-100"),
    matchLevel: z.string().default("Good Match"),
    summary: z.string().default("Candidate evaluation completed successfully."),
    strengths: z.array(z.string()).default([]),
    criticalGaps: z.array(z.string()).default([]),
    missingKeywords: z.array(z.string()).default([]),
    recommendedRoles: z.array(z.string()).default([]),
    actionableRewrites: z.array(ResumeRewriteSchema).default([]),
  }),
});

export type ResumeScreeningData = z.infer<typeof ResumeScreeningSchema>;

// Backward compatibility schema for legacy callers
export const ResumeAnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100),
  keywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  issues: z.array(z.string()),
  rewrites: z.array(ResumeRewriteSchema),
  summary: z.string(),
  strengthAreas: z.array(z.string()),
  improvementPriorities: z.array(z.string()),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;
