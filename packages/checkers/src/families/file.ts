import { registerChecker } from "../registry";
import { fail, pass, type CheckerContext } from "../types";

/**
 * Checks that read a workspace file as TEXT rather than as a rendered page.
 * Deployment lessons need these: package.json, .env.example and .gitignore are
 * real deliverables, but nothing renders them.
 */

function source(ctx: CheckerContext, file: string): string | null {
  return ctx.files[file]?.content ?? null;
}

const clip = (s: string, n = 160): string => (s.length > n ? s.slice(0, n) + "…" : s);

// ── file.matches ─────────────────────────────────────────────────────────────
// args: { file, pattern, flags?, absent? }
registerChecker("file.matches", (args, ctx) => {
  const file = String(args.file);
  const src = source(ctx, file);
  if (src === null) return fail("file not found", file);

  const re = new RegExp(String(args.pattern), typeof args.flags === "string" ? args.flags : "u");
  const found = re.test(src);

  if (args.absent === true) {
    return found ? fail(`${file} matches /${args.pattern}/`, `no match in ${file}`) : pass();
  }
  return found ? pass({ actual: file }) : fail(`no match in ${file}`, `/${args.pattern}/`);
});

// ── file.json ────────────────────────────────────────────────────────────────
// args: { file, path, equals? | contains? | exists? }
// `path` is dot/bracket notation: "scripts.build", "engines.node", "files[0]".
registerChecker("file.json", (args, ctx) => {
  const file = String(args.file);
  const src = source(ctx, file);
  if (src === null) return fail("file not found", file);

  let parsed: unknown;
  try {
    parsed = JSON.parse(src);
  } catch (e) {
    // Invalid JSON is the student's mistake, not an infra problem — say so.
    return fail(`${file} is not valid JSON`, "valid JSON", {
      raw: e instanceof Error ? e.message : String(e),
    });
  }

  const path = String(args.path);
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);

  let value: unknown = parsed;
  for (const key of keys) {
    if (value === null || typeof value !== "object") {
      value = undefined;
      break;
    }
    value = (value as Record<string, unknown>)[key];
  }

  if (value === undefined) {
    return args.exists === false ? pass() : fail(`${path} is missing`, path);
  }
  if (args.exists === false) return fail(`${path} is present`, `no ${path}`);
  if (args.exists === true) return pass({ actual: clip(String(value)) });

  const text = typeof value === "string" ? value : JSON.stringify(value);

  if (typeof args.equals === "string") {
    return text === args.equals ? pass({ actual: clip(text) }) : fail(clip(text), args.equals);
  }
  if (typeof args.contains === "string") {
    return text.includes(args.contains)
      ? pass({ actual: clip(text) })
      : fail(clip(text), `contains "${args.contains}"`);
  }
  if (typeof args.matches === "string") {
    return new RegExp(args.matches, "u").test(text)
      ? pass({ actual: clip(text) })
      : fail(clip(text), `/${args.matches}/`);
  }

  return pass({ actual: clip(text) });
});
