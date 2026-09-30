import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = req.nextUrl.searchParams;

  const trackSlug = searchParams.get("trackSlug");
  const gapOnly = searchParams.get("gapOnly") === "true";
  const type = searchParams.get("type");
  const cost = searchParams.get("cost");
  const level = searchParams.get("level");
  const search = searchParams.get("search")?.toLowerCase().trim();

  let userMissingSkills: string[] = [];

  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    const latestGap = await db.gapAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (latestGap && latestGap.missingSkills) {
      try {
        const parsed = JSON.parse(latestGap.missingSkills);
        userMissingSkills = parsed.map((m: { skill: string }) => m.skill);
      } catch {
        userMissingSkills = [];
      }
    }
  }

  // Fetch all learning resources
  const allResources = await db.learningResource.findMany({
    orderBy: [{ level: "asc" }, { title: "asc" }],
  });

  const missingSkillsLower = userMissingSkills.map((s) => s.toLowerCase().trim());

  // Filter in memory
  let filtered = allResources.map((res) => {
    let skillsArray: string[] = [];
    try {
      skillsArray = typeof res.skills === "string" ? JSON.parse(res.skills) : res.skills;
    } catch {
      skillsArray = [];
    }

    const matchedGaps = skillsArray.filter((s) =>
      missingSkillsLower.includes(s.toLowerCase().trim())
    );

    return {
      ...res,
      skills: skillsArray,
      matchedGaps,
      isGapMatch: matchedGaps.length > 0,
    };
  });

  // Apply trackSlug filter if specified
  if (trackSlug) {
    const track = await db.careerTrack.findUnique({
      where: { slug: trackSlug },
    });
    if (track && track.requiredSkills) {
      const trackSkills = (
        typeof track.requiredSkills === "string"
          ? JSON.parse(track.requiredSkills)
          : track.requiredSkills
      ).map((s: string) => s.toLowerCase().trim());

      filtered = filtered.filter((r) =>
        r.skills.some((s: string) => trackSkills.includes(s.toLowerCase().trim()))
      );
    }
  }

  // Apply gapOnly filter
  if (gapOnly && userMissingSkills.length > 0) {
    filtered = filtered.filter((r) => r.isGapMatch);
  }

  // Apply type filter
  if (type && type !== "ALL") {
    filtered = filtered.filter((r) => r.type === type);
  }

  // Apply cost filter
  if (cost && cost !== "ALL") {
    filtered = filtered.filter((r) => r.cost === cost);
  }

  // Apply level filter
  if (level && level !== "ALL") {
    filtered = filtered.filter((r) => r.level === level);
  }

  // Apply search query filter
  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(search) ||
        r.provider.toLowerCase().includes(search) ||
        r.skills.some((s: string) => s.toLowerCase().includes(search))
    );
  }

  // Sort resources with gap matches first
  filtered.sort((a, b) => {
    if (a.isGapMatch && !b.isGapMatch) return -1;
    if (!a.isGapMatch && b.isGapMatch) return 1;
    return 0;
  });

  return NextResponse.json({
    resources: filtered,
    total: filtered.length,
    userGaps: userMissingSkills,
  });
}
