import { JobProvider, JobQuery, JobListing } from "./types";
import { db } from "@/lib/db";

export class SeedJobProvider implements JobProvider {
  async search(query: JobQuery): Promise<JobListing[]> {
    const jobs = await db.job.findMany({
      take: query.limit || 20,
    });

    if (jobs.length > 0) {
      return jobs.map((j) => {
        let reqs: string[] = [];
        try {
          reqs = JSON.parse(j.requirements);
        } catch {
          reqs = [];
        }
        return {
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location,
          type: j.type,
          salary: j.salary || undefined,
          description: j.description,
          requirements: reqs,
          url: j.url,
          deadline: j.deadline || undefined,
        };
      });
    }

    // Default seeded stub listings
    return [
      {
        id: "seed-job-1",
        title: "Graduate Software Engineer (Frontend / React)",
        company: "Stripe",
        location: "Remote / Bangalore",
        type: "FULL_TIME",
        salary: "₹18-24 LPA",
        description: "Join Stripe to build world-class user interfaces and developer billing workflows with React and TypeScript.",
        requirements: ["React", "TypeScript", "HTML5 & CSS3", "Git & GitHub"],
        url: "https://stripe.com/jobs",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: "seed-job-2",
        title: "Full Stack Intern",
        company: "Microsoft",
        location: "Hyderabad / Hybrid",
        type: "INTERNSHIP",
        salary: "₹80,000 / month",
        description: "Develop scalable cloud applications and enterprise dashboard components using Next.js, Azure, and RESTful APIs.",
        requirements: ["JavaScript", "TypeScript", "React", "Node.js", "SQL"],
        url: "https://careers.microsoft.com",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "seed-job-3",
        title: "Associate Cloud & DevOps Engineer",
        company: "Amazon Web Services (AWS)",
        location: "Bangalore",
        type: "FULL_TIME",
        salary: "₹16-22 LPA",
        description: "Work with global enterprise customers to automate cloud infrastructure, container orchestration, and CI/CD pipelines.",
        requirements: ["AWS", "Docker", "Linux / Bash", "Python", "CI/CD Pipelines"],
        url: "https://amazon.jobs",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // near deadline
      },
    ];
  }
}

export const jobProvider: JobProvider = new SeedJobProvider();
