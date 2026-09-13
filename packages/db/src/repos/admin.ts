import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../client";

/**
 * Ensure the deployment has at least one ADMIN, without anyone touching the DB
 * by hand. Runs at deploy time (postinstall provisioning): if no admin exists
 * yet, promote either the ADMIN_EMAIL account (when that env is set) or the
 * earliest-registered user — the site owner in practice. Idempotent: once an
 * admin exists it does nothing, so it is safe to run on every deploy.
 */
export async function ensureBootstrapAdmin(
  client: PrismaClient = defaultPrisma,
): Promise<string> {
  const adminCount = await client.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) return "admin already exists";

  const wanted = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const target = wanted
    ? await client.user.findUnique({ where: { email: wanted } })
    : await client.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!target) return wanted ? `no user with email ${wanted}` : "no users to promote yet";

  await client.user.update({ where: { id: target.id }, data: { role: "ADMIN" } });
  return `promoted ${target.email} to ADMIN`;
}
