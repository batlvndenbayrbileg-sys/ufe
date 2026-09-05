import { dirname, join } from "node:path";
import ts from "typescript";
import { registerChecker } from "../registry";
import { fail, pass, type CheckerContext } from "../types";

/**
 * TypeScript checks, graded by the REAL compiler.
 *
 * Node-only: registered from ./server, not ./index, so the browser bundle never
 * pulls the compiler in. In the preview the harness reports these as `infra`
 * and the server's verdict stands — the same arrangement css.responsive uses.
 *
 * The preview still RUNS the student's TypeScript, because Sucrase strips the
 * types; what it cannot do is judge them. That is what this is for.
 */

const OPTIONS: ts.CompilerOptions = {
  strict: true,
  noImplicitAny: true,
  strictNullChecks: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noEmit: true,
  skipLibCheck: true,
  // No DOM: these lessons are about the type system, not the browser.
  lib: ["lib.es2022.d.ts"],
};

const libDir = dirname(ts.sys.getExecutingFilePath());

/** Compile an in-memory file set and return whatever the compiler complains about. */
function compile(sources: Record<string, string>): ts.Diagnostic[] {
  const host: ts.CompilerHost = {
    fileExists: (f) => f in sources || ts.sys.fileExists(f),
    readFile: (f) => (f in sources ? sources[f] : ts.sys.readFile(f)),
    getSourceFile: (f, languageVersion) => {
      const text = f in sources ? sources[f] : ts.sys.readFile(f);
      return text === undefined ? undefined : ts.createSourceFile(f, text, languageVersion, true);
    },
    getDefaultLibFileName: (options) => join(libDir, ts.getDefaultLibFileName(options)),
    getDefaultLibLocation: () => libDir,
    writeFile: () => {},
    getCurrentDirectory: () => "/",
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
  };

  const program = ts.createProgram(Object.keys(sources), OPTIONS, host);
  return [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()];
}

/** The student's TypeScript, keyed the way the compiler wants it. */
function tsSources(ctx: CheckerContext, only?: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, file] of Object.entries(ctx.files)) {
    if (!/\.tsx?$/.test(path)) continue;
    if (only && !only.includes(path)) continue;
    out[`/${path}`] = file.content;
  }
  return out;
}

function describe(d: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(d.messageText, " ");
  if (!d.file || d.start === undefined) return `TS${d.code}: ${message}`;
  const { line } = d.file.getLineAndCharacterOfPosition(d.start);
  return `${d.file.fileName.replace(/^\//, "")}:${line + 1} — TS${d.code}: ${message}`;
}

// ── ts.typecheck ─────────────────────────────────────────────────────────────
// args: { files?: string[] } — every .ts/.tsx in the workspace by default.
registerChecker("ts.typecheck", (args, ctx) => {
  const sources = tsSources(ctx, args.files as string[] | undefined);
  if (Object.keys(sources).length === 0) return fail("no TypeScript files", "a .ts file to check");

  const diagnostics = compile(sources);
  if (diagnostics.length === 0) return pass({ actual: "0 type errors" });

  return fail(describe(diagnostics[0]!), "no type errors", {
    raw: diagnostics.map(describe).join("\n"),
  });
});

// ── ts.rejects ───────────────────────────────────────────────────────────────
// The mutation test for types: append a deliberately WRONG usage and require
// the compiler to reject it. A type that accepts everything (`any`) would pass
// ts.typecheck happily while proving nothing — this is what catches that.
// args: { file, code, code2?… via `code` string; expectCode?: number }
registerChecker("ts.rejects", (args, ctx) => {
  const file = String(args.file);
  const source = ctx.files[file]?.content;
  if (source === undefined) return fail("file not found", file);

  const sources = tsSources(ctx);
  sources[`/${file}`] = `${source}\n\n// —— шалгалтын хэсэг ——\n${String(args.code)}\n`;

  const diagnostics = compile(sources);
  if (diagnostics.length === 0) {
    return fail("the compiler accepted it", "a type error");
  }

  if (typeof args.expectCode === "number") {
    const codes = diagnostics.map((d) => d.code);
    return codes.includes(args.expectCode)
      ? pass({ actual: `TS${args.expectCode}` })
      : fail(`TS${codes[0]}`, `TS${args.expectCode}`);
  }

  return pass({ actual: describe(diagnostics[0]!) });
});
