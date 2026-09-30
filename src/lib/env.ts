import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  NEXTAUTH_URL: z.string().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().default("connect-development-secret-key-32-characters-long"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  PROVIDER_SKILLS: z.enum(["seed", "onet"]).default("seed"),
  PROVIDER_JOBS: z.enum(["seed", "live"]).default("seed"),
  PROVIDER_GOV: z.enum(["seed", "live"]).default("seed"),
  PROVIDER_SCHOLARSHIPS: z.enum(["seed", "live"]).default("seed"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  PROVIDER_SKILLS: process.env.PROVIDER_SKILLS,
  PROVIDER_JOBS: process.env.PROVIDER_JOBS,
  PROVIDER_GOV: process.env.PROVIDER_GOV,
  PROVIDER_SCHOLARSHIPS: process.env.PROVIDER_SCHOLARSHIPS,
});
