import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const consentSchema = z.object({
  consents: z.array(
    z.object({
      type: z.enum(["TERMS", "PRIVACY", "DATA_PROCESSING", "AI_USAGE"]),
      granted: z.boolean(),
    })
  ),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userConsents = await db.consent.findMany({
    where: { userId },
  });

  return NextResponse.json({ consents: userConsents });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const parsed = consentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid consent data" }, { status: 400 });
    }

    for (const c of parsed.data.consents) {
      await db.consent.upsert({
        where: {
          userId_type: {
            userId,
            type: c.type,
          },
        },
        update: {
          granted: c.granted,
          grantedAt: new Date(),
        },
        create: {
          userId,
          type: c.type,
          granted: c.granted,
          version: "1.0",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Consents recorded" });
  } catch (error) {
    console.error("Consent recording error:", error);
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }
}
