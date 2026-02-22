import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function pickRuntimeConnectionString(): string | null {
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const directUrl = process.env.DIRECT_URL?.trim() || "";

  // Runtime should prefer Supabase pooler URLs for serverless workloads.
  const looksLikePooler = (url: string) => /pooler/i.test(url) || /:6543(\/|$|\?)/.test(url);

  if (databaseUrl && looksLikePooler(databaseUrl)) return databaseUrl;
  if (directUrl && looksLikePooler(directUrl)) return directUrl;
  if (databaseUrl) return databaseUrl;
  if (directUrl) return directUrl;
  return null;
}

function createPrisma(): PrismaClient {
  const connectionString = pickRuntimeConnectionString();
  if (!connectionString) throw new Error("DATABASE_URL and DIRECT_URL are not set");
  let url = connectionString;
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&" : "?";
    url += "sslmode=require";
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  globalForPrisma.prisma = createPrisma();
  return globalForPrisma.prisma;
}
