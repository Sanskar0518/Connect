import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const tracks = await db.careerTrack.findMany({
      orderBy: { title: "asc" },
    });

    const formatted = tracks.map((t) => ({
      ...t,
      requiredSkills: typeof t.requiredSkills === "string" ? JSON.parse(t.requiredSkills) : t.requiredSkills,
    }));

    return NextResponse.json({ tracks: formatted });
  } catch (error) {
    console.error("Failed to fetch career tracks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
