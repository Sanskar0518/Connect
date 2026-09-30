import { ScholarshipProvider, ScholarshipFilter, ScholarshipItem } from "./types";
import { db } from "@/lib/db";

export class SeedScholarshipProvider implements ScholarshipProvider {
  async list(filter: ScholarshipFilter): Promise<ScholarshipItem[]> {
    const records = await db.scholarship.findMany({
      take: filter.limit || 20,
    });

    if (records.length > 0) {
      return records.map((s) => {
        let criteria: Record<string, unknown> = {};
        let checklist: string[] = [];
        try {
          criteria = JSON.parse(s.eligibilityCriteria);
          checklist = JSON.parse(s.checklist);
        } catch {
          // ignore
        }
        return {
          id: s.id,
          title: s.title,
          provider: s.provider,
          amount: s.amount,
          deadline: s.deadline || undefined,
          eligibilityCriteria: criteria,
          description: s.description,
          url: s.url,
          checklist,
        };
      });
    }

    return [
      {
        id: "sch-seed-1",
        title: "Reliance Foundation Undergraduate Scholarship in Technology",
        provider: "Reliance Foundation",
        amount: "Up to ₹2,00,000 / year",
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        eligibilityCriteria: {
          degree: ["B.Tech", "B.E.", "BCA"],
          minGPA: 3.5,
          annualIncomeMax: "₹15,00,000",
        },
        description: "Merit-cum-means scholarship supporting ambitious undergraduate students in computer science, mathematics, and emerging technology degrees.",
        url: "https://www.scholarships.reliancefoundation.org/",
        checklist: [
          "Upload official semester transcript",
          "Provide proof of household income",
          "Submit 500-word statement of career intent",
          "Two academic reference letters",
        ],
      },
      {
        id: "sch-seed-2",
        title: "Generation Google Scholarship (APAC)",
        provider: "Google",
        amount: "$2,500 USD (~₹2,05,000)",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        eligibilityCriteria: {
          degree: ["B.Tech", "B.S."],
          year: [1, 2, 3],
          focus: "Computer Science or related technical field",
        },
        description: "Awarded to aspiring students who excel in computing and demonstrate a strong commitment to diversity, equity, and inclusion in tech.",
        url: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
        checklist: [
          "Resume highlighting technical leadership",
          "Current academic transcript",
          "Response to two short essay questions",
          "15-minute coding challenge sample",
        ],
      },
    ];
  }
}

export const scholarshipProvider: ScholarshipProvider = new SeedScholarshipProvider();
