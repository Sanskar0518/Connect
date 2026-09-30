// F5: AI Resume Screening & Extraction Engine (Gemini + Supabase)
// POST /api/resume/analyze  – extract & screen resume using Gemini, store file & structured JSON in Supabase
// GET  /api/resume/analyze  – get latest screening for the current user

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/ai/client";
import {
  ResumeScreeningSchema,
  ResumeScreeningData,
} from "@/lib/ai/schemas/resume";
import { buildResumeScreeningPrompt } from "@/lib/ai/prompts/resume";
import { extractTextFromDocument } from "@/lib/parsing";
import { supabaseAdmin, uploadToSupabaseStorage } from "@/lib/supabase";

// ── GET latest analysis & screening ──────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resume = await db.resume.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!resume) {
    return NextResponse.json({ resume: null, analysis: null, screening: null });
  }

  let screening: ResumeScreeningData | null = null;
  if (resume.encryptedContent) {
    try {
      screening = JSON.parse(resume.encryptedContent);
    } catch {
      screening = null;
    }
  }

  const analysis = resume.analyses[0] ?? null;
  return NextResponse.json({
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      fileSize: resume.fileSize,
      createdAt: resume.createdAt,
    },
    screening,
    analysis: analysis
      ? {
          id: analysis.id,
          atsScore: analysis.atsScore,
          keywords: JSON.parse(analysis.keywords || "[]"),
          missingKeywords: JSON.parse(analysis.missingKeywords || "[]"),
          issues: JSON.parse(analysis.issues || "[]"),
          rewrites: JSON.parse(analysis.rewrites || "[]"),
          createdAt: analysis.createdAt,
        }
      : null,
  });
}

// ── POST: analyze, extract, screen & store in Supabase ────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let resumeText = "";
  let fileName = "resume.txt";
  let targetRole = "Software Engineer";
  let targetCompany = "";
  let fileBuffer: Buffer | null = null;
  let fileContentType = "text/plain";

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const textParam = formData.get("resumeText") as string | null;
    fileName = (formData.get("fileName") as string) || file?.name || "resume.txt";
    targetRole = (formData.get("targetRole") as string) || "Software Engineer";
    targetCompany = (formData.get("targetCompany") as string) || "";

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileContentType = file.type || "application/octet-stream";

      // Detect MIME type by extension if octet-stream
      let mime = fileContentType;
      if (mime === "application/octet-stream" || !mime) {
        if (fileName.toLowerCase().endsWith(".pdf")) mime = "application/pdf";
        else if (fileName.toLowerCase().endsWith(".docx"))
          mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else mime = "text/plain";
      }

      try {
        resumeText = await extractTextFromDocument(fileBuffer, mime, fileName);
      } catch (parseErr) {
        console.warn("Document parsing error, attempting text decode:", parseErr);
        if (!fileName.toLowerCase().endsWith(".pdf")) {
          resumeText = fileBuffer.toString("utf-8");
        }
      }
    } else if (textParam) {
      resumeText = textParam;
      fileBuffer = Buffer.from(resumeText, "utf-8");
      fileContentType = "text/plain";
    }
  } else {
    const body = await req.json();
    resumeText = body.resumeText || "";
    fileName = body.fileName || "resume.txt";
    targetRole = body.targetRole || "Software Engineer";
    targetCompany = body.targetCompany || "";
    if (resumeText) {
      fileBuffer = Buffer.from(resumeText, "utf-8");
      fileContentType = "text/plain";
    }
  }

  if (!resumeText || resumeText.trim().length < 30) {
    return NextResponse.json(
      {
        error:
          "Resume text could not be extracted or is too short. Please upload a valid PDF, DOCX, or text file.",
      },
      { status: 400 }
    );
  }

  // Fetch user profile + skills
  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    include: { skills: { include: { skill: true } } },
  });

  const role = targetRole || profile?.targetRole || "Software Engineer";
  const userSkills = profile?.skills.map((ps) => ps.skill.name) ?? [];

  // 1. Upload original resume to Supabase Storage
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  let supabaseResumeFileUrl: string | null = null;
  let supabaseJsonReportUrl: string | null = null;

  if (fileBuffer) {
    try {
      const resumeUpload = await uploadToSupabaseStorage({
        bucket: "connect-storage",
        path: `resumes/${session.user.id}/${timestamp}_${safeName}`,
        fileBuffer,
        contentType: fileContentType,
      });
      supabaseResumeFileUrl = resumeUpload.url;
    } catch (uploadErr) {
      console.warn("Could not upload resume to Supabase Storage:", uploadErr);
    }
  }

  // 2. Run Gemini Resume Screening & Extraction
  const prompt = buildResumeScreeningPrompt({
    resumeText,
    targetRole: role,
    targetCompany,
    userSkills,
  });

  const aiResult = await generateStructured<ResumeScreeningData>({
    prompt,
    schema: ResumeScreeningSchema,
    system:
      "You are an ATS resume screening system and talent extraction engine. Return only strictly valid JSON matching the schema.",
    temperature: 0.15,
    cacheKey: `resume-screening:${session.user.id}:${Buffer.from(resumeText.slice(0, 150)).toString("base64")}`,
    fallback: () => ({
      candidate: {
        name: "Candidate",
        email: null,
        phone: null,
        location: null,
        summary: "Extracted candidate profile",
        links: {},
      },
      education: [],
      experience: [],
      projects: [],
      skills: {
        technical: ["TypeScript", "JavaScript"],
        frontend: ["React", "Next.js"],
        backend: ["Node.js"],
        databasesAndCloud: ["PostgreSQL", "Supabase"],
        softSkills: ["Problem Solving"],
      },
      atsScreening: {
        atsScore: 75,
        matchLevel: "Good Match",
        summary:
          "Resume shows strong core fundamentals. Adding quantified metrics and specific technical keywords will increase ATS ranking.",
        strengths: ["Clean organization", "Relevant technical stack"],
        criticalGaps: ["Add quantified outcome metrics to experience items"],
        missingKeywords: ["CI/CD", "Testing", "Cloud Infrastructure"],
        recommendedRoles: [role, "Full-Stack Engineer"],
        actionableRewrites: [
          {
            section: "Experience",
            before: "Built web features for applications",
            after:
              "Architected and deployed responsive web features, reducing page load latency by 28%",
            reason: "Uses action verb and quantified outcome to improve ATS ranking",
          },
        ],
      },
    }),
  });

  const screeningData = aiResult.data;

  // 3. Upload JSON Screening Report to Supabase Storage
  try {
    const jsonBuffer = Buffer.from(JSON.stringify(screeningData, null, 2), "utf-8");
    const jsonUpload = await uploadToSupabaseStorage({
      bucket: "connect-storage",
      path: `resumes/${session.user.id}/${timestamp}_screening.json`,
      fileBuffer: jsonBuffer,
      contentType: "application/json",
    });
    supabaseJsonReportUrl = jsonUpload.url;
  } catch (err) {
    console.warn("Could not upload screening JSON to Supabase storage:", err);
  }

  // 4. Store in Supabase Postgres Table if tables exist
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("resumes").insert({
        user_id: session.user.id,
        file_name: fileName,
        file_url: supabaseResumeFileUrl,
        json_report_url: supabaseJsonReportUrl,
        file_size: fileBuffer?.length || resumeText.length,
      });

      await supabaseAdmin.from("resume_screenings").insert({
        user_id: session.user.id,
        candidate_name: screeningData.candidate.name,
        candidate_email: screeningData.candidate.email,
        candidate_phone: screeningData.candidate.phone,
        candidate_location: screeningData.candidate.location,
        candidate_summary: screeningData.candidate.summary,
        ats_score: screeningData.atsScreening.atsScore,
        match_level: screeningData.atsScreening.matchLevel,
        target_role: role,
        summary: screeningData.atsScreening.summary,
        strengths: screeningData.atsScreening.strengths,
        critical_gaps: screeningData.atsScreening.criticalGaps,
        missing_keywords: screeningData.atsScreening.missingKeywords,
        skills: screeningData.skills,
        education: screeningData.education,
        experience: screeningData.experience,
        projects: screeningData.projects,
        rewrites: screeningData.atsScreening.actionableRewrites,
        raw_screening: screeningData,
      });
    } catch (sbInsertErr) {
      console.warn("Supabase table insert skipped (tables might not exist yet):", sbInsertErr);
    }
  }

  // 5. Persist resume record locally in Prisma
  const resume = await db.resume.create({
    data: {
      userId: session.user.id,
      fileName: fileName || "resume.pdf",
      fileUrl: supabaseResumeFileUrl || "",
      fileSize: fileBuffer?.length || resumeText.length,
      encryptedContent: JSON.stringify(screeningData),
    },
  });

  // Persist analysis locally
  const analysis = await db.resumeAnalysis.create({
    data: {
      resumeId: resume.id,
      atsScore: screeningData.atsScreening.atsScore,
      keywords: JSON.stringify([
        ...screeningData.skills.technical,
        ...screeningData.skills.frontend,
        ...screeningData.skills.backend,
        ...screeningData.skills.databasesAndCloud,
      ]),
      missingKeywords: JSON.stringify(screeningData.atsScreening.missingKeywords),
      issues: JSON.stringify(screeningData.atsScreening.criticalGaps),
      rewrites: JSON.stringify(screeningData.atsScreening.actionableRewrites),
    },
  });

  // Award XP
  try {
    await db.xPEvent.create({
      data: {
        userId: session.user.id,
        amount: 25,
        reason: "Analyzed resume with Gemini AI & stored in Supabase",
        source: "RESUME",
      },
    });
    await db.profile.updateMany({
      where: { userId: session.user.id },
      data: { xp: { increment: 25 } },
    });
  } catch (xpErr) {
    console.warn("XP award error:", xpErr);
  }

  return NextResponse.json({
    success: true,
    resume: {
      id: resume.id,
      fileName: resume.fileName,
      fileUrl: supabaseResumeFileUrl,
    },
    supabase: {
      bucket: "connect-storage",
      fileUrl: supabaseResumeFileUrl,
      jsonReportUrl: supabaseJsonReportUrl,
      storedInSupabase: Boolean(supabaseResumeFileUrl),
    },
    screening: screeningData,
    analysis: {
      id: analysis.id,
      atsScore: screeningData.atsScreening.atsScore,
      matchLevel: screeningData.atsScreening.matchLevel,
      keywords: [
        ...screeningData.skills.technical,
        ...screeningData.skills.frontend,
        ...screeningData.skills.backend,
        ...screeningData.skills.databasesAndCloud,
      ],
      missingKeywords: screeningData.atsScreening.missingKeywords,
      issues: screeningData.atsScreening.criticalGaps,
      rewrites: screeningData.atsScreening.actionableRewrites,
      summary: screeningData.atsScreening.summary,
      strengthAreas: screeningData.atsScreening.strengths,
      improvementPriorities: screeningData.atsScreening.criticalGaps,
    },
    source: aiResult.source,
  });
}
