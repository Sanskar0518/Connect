/**
 * POST /api/profile/upload
 * Accepts PDF, DOCX, or TXT; validates, encrypts, stores,
 * then triggers AI extraction to populate Profile, Skills, Courses, Projects.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractTextFromDocument, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/parsing";
import { encrypt, sha256 } from "@/lib/security/crypto";
import { generateStructured } from "@/lib/ai/client";
import { TranscriptParseResultSchema } from "@/lib/ai/schemas/transcript";
import { buildTranscriptParsePrompt } from "@/lib/ai/prompts/transcript";


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
      { status: 415 }
    );
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Compute content hash for caching
  const contentHash = sha256(buffer);

  // Encrypt at rest
  const encryptedContent = encrypt(buffer);

  // Sanitize filename
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

  // Extract text
  let documentText: string;
  try {
    documentText = await extractTextFromDocument(buffer, file.type);
  } catch (err) {
    console.error("Document extraction failed:", err);
    return NextResponse.json({ error: "Could not read document text." }, { status: 422 });
  }

  if (!documentText.trim()) {
    return NextResponse.json({ error: "Document appears to be empty or unreadable." }, { status: 422 });
  }

  // AI extraction — cached by content hash
  const aiResult = await generateStructured({
    prompt: buildTranscriptParsePrompt(documentText),
    schema: TranscriptParseResultSchema,
    temperature: 0.1,
    cacheKey: `transcript:${contentHash}`,
    fallback: () => ({
      courses: [],
      projects: [],
      skills: [
        { name: "Problem Solving", category: "SOFT" as const, confidence: 0.75 },
        { name: "Communication", category: "SOFT" as const, confidence: 0.75 },
      ],
      academicInfo: {},
    }),
  });

  const extracted = aiResult.data;

  // Upsert Profile with academic info
  const profile = await db.profile.upsert({
    where: { userId },
    create: {
      userId,
      college: extracted.academicInfo.college,
      degree: extracted.academicInfo.degree,
      graduationYear: extracted.academicInfo.graduationYear,
      gpa: extracted.academicInfo.gpa,
      headline: extracted.academicInfo.headline,
    },
    update: {
      ...(extracted.academicInfo.college && { college: extracted.academicInfo.college }),
      ...(extracted.academicInfo.degree && { degree: extracted.academicInfo.degree }),
      ...(extracted.academicInfo.graduationYear && { graduationYear: extracted.academicInfo.graduationYear }),
      ...(extracted.academicInfo.gpa && { gpa: extracted.academicInfo.gpa }),
      ...(extracted.academicInfo.headline && { headline: extracted.academicInfo.headline }),
    },
  });

  // Upsert Courses
  for (const course of extracted.courses) {
    await db.course.create({
      data: {
        profileId: profile.id,
        name: course.name,
        code: course.code,
        grade: course.grade,
        credits: course.credits,
        term: course.term,
      },
    });
  }

  // Upsert Projects
  for (const project of extracted.projects) {
    await db.project.create({
      data: {
        profileId: profile.id,
        title: project.title,
        description: project.description,
        technologies: JSON.stringify(project.technologies),
        url: project.url,
        role: project.role,
      },
    });
  }

  // Upsert Skills + ProfileSkills
  for (const skill of extracted.skills) {
    const dbSkill = await db.skill.upsert({
      where: { name: skill.name },
      create: { name: skill.name, category: skill.category },
      update: {},
    });

    await db.profileSkill.upsert({
      where: { profileId_skillId: { profileId: profile.id, skillId: dbSkill.id } },
      create: {
        profileId: profile.id,
        skillId: dbSkill.id,
        confidence: skill.confidence,
        source: "TRANSCRIPT",
      },
      update: {
        confidence: Math.max(skill.confidence, 0),
        source: "TRANSCRIPT",
      },
    });
  }

  // Store encrypted document reference (as a "resume" record for files table)
  await db.resume.create({
    data: {
      userId,
      fileName: safeFileName,
      fileUrl: `encrypted:${contentHash}`,
      fileSize: buffer.length,
      encryptedContent,
    },
  });

  return NextResponse.json({
    success: true,
    source: aiResult.source,
    confidence: aiResult.confidence,
    extracted: {
      skillsCount: extracted.skills.length,
      coursesCount: extracted.courses.length,
      projectsCount: extracted.projects.length,
      academicInfo: extracted.academicInfo,
    },
  });
}
