// GET /api/interview/companies - list companies for interview practice and JD intelligence

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await db.company.findMany({
    include: {
      benchmarks: true,
    },
    orderBy: { name: "asc" },
  });

  const parsed = companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    industry: c.industry,
    logoUrl: c.logoUrl,
    description: c.description,
    culture: c.culture,
    techStack: (() => {
      try {
        return JSON.parse(c.techStack);
      } catch {
        return [];
      }
    })(),
    benchmarks: c.benchmarks.map((b) => ({
      id: b.id,
      role: b.role,
      minReadiness: b.minReadiness,
      skillWeights: (() => {
        try {
          return JSON.parse(b.skillWeights);
        } catch {
          return {};
        }
      })(),
    })),
  }));

  return NextResponse.json({ companies: parsed });
}
