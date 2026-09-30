export interface Competency {
  skillName: string;
  category: "TECHNICAL" | "SOFT" | "DOMAIN";
  importance: "Critical" | "Important" | "Nice-to-have";
  targetScore: number; // 0 to 100
  description?: string;
}

export interface SkillFrameworkProvider {
  getRoleCompetencies(role: string): Promise<Competency[]>;
}

export interface JobQuery {
  keywords?: string;
  location?: string;
  type?: "FULL_TIME" | "INTERNSHIP" | "REMOTE" | "ALL";
  limit?: number;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements: string[];
  url: string;
  deadline?: Date | string;
}

export interface JobProvider {
  search(query: JobQuery): Promise<JobListing[]>;
}

export interface GovFilter {
  state?: string;
  qualification?: string;
  type?: string;
  limit?: number;
}

export interface GovOpportunityItem {
  id: string;
  title: string;
  department: string;
  scheme: string;
  state: string;
  qualification: string;
  deadline?: Date | string;
  description: string;
  url: string;
  type: string;
}

export interface GovFeedProvider {
  list(filter: GovFilter): Promise<GovOpportunityItem[]>;
}

export interface ScholarshipFilter {
  category?: string;
  minAmount?: number;
  limit?: number;
}

export interface ScholarshipItem {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline?: Date | string;
  eligibilityCriteria: Record<string, unknown>;
  description: string;
  url: string;
  checklist: string[];
}

export interface ScholarshipProvider {
  list(filter: ScholarshipFilter): Promise<ScholarshipItem[]>;
}

export interface PageScraper {
  fetchText(url: string): Promise<string | null>;
}
