import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToSupabaseStorage, DEFAULT_STORAGE_BUCKET, isSupabaseConfigured } from "@/lib/supabase";

const MAX_STORAGE_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase storage is not configured. Check environment variables." },
        { status: 503 }
      );
    }

    const userId = (session.user as { id: string }).id;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "documents";
    const customBucket = (formData.get("bucket") as string) || DEFAULT_STORAGE_BUCKET;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_STORAGE_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of ${MAX_STORAGE_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    // Sanitize filename and create storage path
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${folder}/${userId}/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToSupabaseStorage({
      bucket: customBucket,
      path: storagePath,
      fileBuffer: buffer,
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

    if (result.error || !result.url) {
      return NextResponse.json(
        { error: result.error || "Storage upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
      bucket: result.bucket,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err: unknown) {
    console.error("Storage upload exception:", err);
    const message = err instanceof Error ? err.message : "Internal storage error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
