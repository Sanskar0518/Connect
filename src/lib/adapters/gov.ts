import { GovFeedProvider, GovFilter, GovOpportunityItem } from "./types";
import { db } from "@/lib/db";

export class SeedGovFeedProvider implements GovFeedProvider {
  async list(filter: GovFilter): Promise<GovOpportunityItem[]> {
    const records = await db.govOpportunity.findMany({
      where: {
        ...(filter.state ? { state: filter.state } : {}),
        ...(filter.type ? { type: filter.type } : {}),
      },
      take: filter.limit || 20,
    });

    if (records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        title: r.title,
        department: r.department,
        scheme: r.scheme,
        state: r.state,
        qualification: r.qualification,
        deadline: r.deadline || undefined,
        description: r.description,
        url: r.url,
        type: r.type,
      }));
    }

    return [
      {
        id: "gov-seed-1",
        title: "National Apprenticeship Training Scheme (NATS) - IT Graduate Apprentices",
        department: "Ministry of Education / Board of Apprenticeship Training",
        scheme: "NATS 2.0 Digital India Initiative",
        state: "All India",
        qualification: "B.Tech / B.E. / BCA / MCA (Graduating 2024-2026)",
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        description: "1-year on-the-job apprenticeship with monthly government-subsidized stipend (₹12,000/mo) across public PSUs and tech labs.",
        url: "https://nats.education.gov.in/",
        type: "APPRENTICESHIP",
      },
      {
        id: "gov-seed-2",
        title: "NIC Scientist / Technical Assistant Recruitment",
        department: "National Informatics Centre (NIC), MeitY",
        scheme: "Digital Governance Cadre",
        state: "Central / Multiple States",
        qualification: "B.Tech (CS/IT/ECE) with 60%+",
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        description: "Direct recruitment for Technical Assistant 'A' and Scientist 'B' positions to build national digital infrastructure.",
        url: "https://www.calicut.nielit.in/nic/",
        type: "JOB",
      },
    ];
  }
}

export const govProvider: GovFeedProvider = new SeedGovFeedProvider();
