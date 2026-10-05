import type { NextRequest } from "next/server";
import { prisma } from "@khiye/db";
import { ok, route } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Strip anything that could carry credentials before a message leaves here. */
function redact(message: string): string {
  return message
    .replace(/postgres(ql)?:\/\/\S+/gi, "<connection-string-redacted>")
    .replace(/:[^:@\s/]+@/g, ":<redacted>@")
    .slice(0, 220);
}

function classify(message: string): string | null {
  const missingEnv = /Environment variable not found:\s*(\w+)/i.exec(message);
  if (missingEnv) return `Environment variable not set: ${missingEnv[1]}`;
  if (/can't reach database server/i.test(message)) return "Can't reach database server";
  if (/authentication failed/i.test(message)) return "Authentication failed";
  if (/does not exist/i.test(message)) return "Database or table does not exist";
  return null;
}

/**
 * Is the database actually reachable?
 *
 * Every DB-backed endpoint returns an opaque INTERNAL, so a broken connection
 * looks exactly like a bug in whatever page you happened to open — the new
 * stage leaderboard and the long-standing module leaderboard were failing
 * identically, which is what pointed at the DB itself.
 *
 * The connection string is redacted before anything is returned; the reason
 * (missing env var vs unreachable vs auth) is what picks the fix.
 */
export function GET(_req: NextRequest) {
  return route(async () => {
    const started = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return ok({ ok: true, ms: Date.now() - started });
    } catch (e) {
      const err = e as { name?: string; code?: string };
      const raw = e instanceof Error ? e.message : String(e);
      return ok({
        ok: false,
        ms: Date.now() - started,
        errorName: err?.name ?? "Unknown",
        prismaCode: err?.code ?? null,
        reason: classify(raw),
        safeMessage: redact(raw),
      });
    }
  });
}
