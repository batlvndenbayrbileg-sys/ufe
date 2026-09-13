// Deploy-time DB provisioning, run from the root postinstall so it happens
// automatically on Vercel with the project's own DATABASE_URL — no manual
// terminal steps. Every step is best-effort: a DB hiccup logs and continues so
// it can NEVER break `pnpm install` or a Vercel build. Skips entirely when no
// DATABASE_URL is set (e.g. local dev in demo mode).
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[provision] no DATABASE_URL — skipping DB provisioning");
  process.exit(0);
}

function tryRun(label, cmd) {
  try {
    console.log(`[provision] ${label}…`);
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error(`[provision] ${label} failed (non-fatal): ${e?.message ?? e}`);
  }
}

// Apply any pending migrations, seed/refresh course content, ensure an admin.
tryRun("prisma migrate deploy", "pnpm --filter @khiye/db exec prisma migrate deploy");
tryRun("content provision", "pnpm --filter @khiye/content-sdk content provision ../../content/courses");

process.exit(0);
