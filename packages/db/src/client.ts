import { PrismaClient } from "@prisma/client";

/**
 * Serverless connection budget.
 *
 * Production sits behind a pooler in SESSION mode with `pool_size: 15`, while
 * Prisma's default `connection_limit` is (num_cpus * 2 + 1). A couple of warm
 * lambdas were enough to hold the entire pool, after which every query died
 * with "max clients reached" — leaderboards 500'd and, worse, submissions
 * silently failed to persist because the submit route swallows write errors.
 *
 * One connection per instance keeps many instances inside the budget, and a
 * pool_timeout makes a brief spike wait instead of failing instantly. Both are
 * only defaults: anything already set in DATABASE_URL wins.
 */
function connectionUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
    return url.toString();
  } catch {
    return raw; // unparseable — leave exactly as configured
  }
}

/**
 * Prisma client singleton. Cached on globalThis in EVERY environment: in dev it
 * survives HMR reloads, and in production it stops a warm lambda from building
 * a second client (and a second pool) if the module is evaluated again.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const url = connectionUrl();

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });

globalForPrisma.prisma = prisma;

export type { PrismaClient } from "@prisma/client";
