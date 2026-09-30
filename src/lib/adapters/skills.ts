import { SkillFrameworkProvider, Competency } from "./types";
import { db } from "@/lib/db";

export class SeedSkillFrameworkProvider implements SkillFrameworkProvider {
  async getRoleCompetencies(role: string): Promise<Competency[]> {
    // Try to match from CareerTrack in DB
    const track = await db.careerTrack.findFirst({
      where: {
        title: {
          contains: role,
        },
      },
    });

    if (track) {
      try {
        const requiredSkills: string[] = JSON.parse(track.requiredSkills);
        return requiredSkills.map((skillName, idx) => ({
          skillName,
          category: idx < 5 ? "TECHNICAL" : "SOFT",
          importance: idx < 3 ? "Critical" : idx < 6 ? "Important" : "Nice-to-have",
          targetScore: 80,
          description: `Core competency for ${track.title}`,
        }));
      } catch {
        // Fall back below
      }
    }

    // Default fallback competencies
    return [
      { skillName: "TypeScript", category: "TECHNICAL", importance: "Critical", targetScore: 85 },
      { skillName: "React", category: "TECHNICAL", importance: "Critical", targetScore: 85 },
      { skillName: "Node.js", category: "TECHNICAL", importance: "Important", targetScore: 75 },
      { skillName: "SQL", category: "TECHNICAL", importance: "Important", targetScore: 75 },
      { skillName: "Problem Solving", category: "SOFT", importance: "Critical", targetScore: 85 },
      { skillName: "Team Collaboration", category: "SOFT", importance: "Important", targetScore: 80 },
      { skillName: "Agile & Scrum Methodologies", category: "DOMAIN", importance: "Nice-to-have", targetScore: 70 },
    ];
  }
}

export const skillProvider: SkillFrameworkProvider = new SeedSkillFrameworkProvider();
