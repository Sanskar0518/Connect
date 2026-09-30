import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If user provided a remote database connection string (e.g. Supabase / Postgres)
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  // On Vercel / serverless runtime (where the application root is strictly read-only)
  if (process.env.VERCEL) {
    const tmpDb = path.join("/tmp", "connect.db");
    if (!fs.existsSync(tmpDb)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "seed.db"),
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDb);
            break;
          } catch (e) {
            console.error("Failed to copy seed database to /tmp:", e);
          }
        }
      }
    }
    return `file:${tmpDb}`;
  }

  // Local development: resolve absolute path to prisma/dev.db
  const localDb = path.resolve(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(localDb)) {
    return `file:${localDb.replace(/\\/g, "/")}`;
  }

  const localSeed = path.resolve(process.cwd(), "prisma", "seed.db");
  if (fs.existsSync(localSeed)) {
    return `file:${localSeed.replace(/\\/g, "/")}`;
  }

  return envUrl || "file:./prisma/dev.db";
}

const resolvedDbUrl = getDatabaseUrl();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDbUrl;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

export const db = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

export default db;
