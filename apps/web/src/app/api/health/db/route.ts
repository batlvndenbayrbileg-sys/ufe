import type { NextRequest } from "next/server";
import { prisma } from "@khiye/db";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Is the database actually reachable?
 *
 * Every DB-backed endpoint returns an opaque INTERNAL, so a broken connection
 * looks exactly like a bug in whatever you happened to open. One trivial query
 * separates the two.
 *
 * Deliberately returns only the error's NAME and Prisma CODE — never the
 * message, which can carry the host and credentials from the connection string.
 * The code alone is diagnostic: P1001 unreachable, P1000 auth failed,
 * P2021 table missing (not migrated), P1017 connection closed.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    const started = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return ok({ ok: true, ms: Date.now() - started });
    } catch (e) {
      const err = e as { name?: string; code?: string };
      return ok({
        ok: false,
        ms: Date.now() - started,
        errorName: err?.name ?? "Unknown",
        prismaCode: err?.code ?? null,
        hint:
          err?.code === "P1001"
            ? "Database unreachable — wrong host/port, paused instance, or network."
            : err?.code === "P1000"
              ? "Authentication failed — credentials in DATABASE_URL are wrong."
              : err?.code === "P2021"
                ? "Table missing — migrations have not been applied to this database."
                : err?.code === "P1017"
                  ? "Server closed the connection."
                  : null,
      });
    }
  });
}
