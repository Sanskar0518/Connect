import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey));
}

// Single client instance cache
declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: SupabaseClient | undefined;
}

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (typeof window !== "undefined") {
    if (!globalThis.__supabaseBrowserClient) {
      globalThis.__supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return globalThis.__supabaseBrowserClient;
  }
  if (!serverClientInstance) {
    serverClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return serverClientInstance;
}

export const supabase = typeof window !== "undefined" ? getSupabaseClient() : null;

// Server-side admin client using the service role key for privileged access (e.g. storage, admin ops)
// Strictly guarded so it is NEVER initialized in browser context (which triggers multiple GoTrueClient warnings)
export const supabaseAdmin =
  typeof window === "undefined" && isSupabaseConfigured() && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Default storage bucket name for Connect assets (transcripts, resumes, avatars, project media)
 */
export const DEFAULT_STORAGE_BUCKET = "connect-storage";

/**
 * Ensures a Supabase storage bucket exists. If not, attempts to create it.
 */
export async function ensureBucketExists(
  bucketName: string = DEFAULT_STORAGE_BUCKET,
  isPublic: boolean = true
): Promise<boolean> {
  if (!supabaseAdmin) return false;
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.warn("Could not list Supabase buckets:", listError.message);
      return false;
    }

    const exists = buckets?.some((b) => b.name === bucketName);
    if (exists) return true;

    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 25 * 1024 * 1024, // 25 MB
    });

    if (createError) {
      console.warn(`Could not create bucket ${bucketName}:`, createError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in ensureBucketExists:", err);
    return false;
  }
}

export interface UploadOptions {
  bucket?: string;
  path: string;
  fileBuffer: Buffer | Uint8Array | Blob;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadResult {
  url: string | null;
  path: string;
  bucket: string;
  error?: string;
}

/**
 * Uploads a file to Supabase Storage with bucket auto-provisioning
 */
export async function uploadToSupabaseStorage({
  bucket = DEFAULT_STORAGE_BUCKET,
  path,
  fileBuffer,
  contentType,
  upsert = true,
}: UploadOptions): Promise<UploadResult> {
  if (!supabaseAdmin) {
    return {
      url: null,
      path,
      bucket,
      error: "Supabase is not configured.",
    };
  }

  try {
    await ensureBucketExists(bucket, true);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert,
      });

    if (uploadError) {
      return {
        url: null,
        path,
        bucket,
        error: uploadError.message,
      };
    }

    const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

    return {
      url: publicData?.publicUrl || null,
      path,
      bucket,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    return {
      url: null,
      path,
      bucket,
      error: message,
    };
  }
}
