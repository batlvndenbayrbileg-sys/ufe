/**
 * `khiye content` CLI (docs/blueprint/04 §4.6, 18 T3.3).
 * Run via: pnpm --filter @khiye/content-sdk content <cmd> <dir> [flags]
 *
 *   lint  <dir> [--strict]        structural rules (§4.5); exits 1 on errors
 *   build <dir> --out <file>      write the JSON course bundle
 *   sync  <dir>                   upsert the course into Postgres (needs DATABASE_URL)
 *   test  <dir>                   lint --strict for now; checker-based testing lands in E6
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadCourse } from "./loader";
import { lintCourse, summarize, type Diagnostic } from "./lint";
import { bundleCourse, type CourseBundle } from "./build";

function fail(msg: string): never {
  process.stderr.write(`✖ ${msg}\n`);
  process.exit(1);
}

function printDiagnostics(diags: Diagnostic[]): void {
  for (const d of diags) {
    const loc = d.taskId ? `${d.lessonId}/${d.taskId}` : d.lessonId;
    const mark = d.severity === "error" ? "✖" : "⚠";
    process.stdout.write(`  ${mark} [${d.code}] ${loc}: ${d.message}\n`);
  }
}

function runLint(dir: string, strict: boolean): number {
  const course = loadCourse(dir);
  const diags = lintCourse(course);
  const { errors, warnings } = summarize(diags);
  printDiagnostics(diags);
  process.stdout.write(
    `content lint: ${errors} error(s), ${warnings} warning(s) across ${course.stages.length} stage(s)\n`,
  );
  if (errors > 0) return 1;
  if (strict && warnings > 0) return 1;
  return 0;
}

function runBuild(dir: string, out: string): number {
  const course = loadCourse(dir);
  const diags = lintCourse(course);
  if (summarize(diags).errors > 0) {
    printDiagnostics(diags.filter((d) => d.severity === "error"));
    fail("refusing to build: content has lint errors");
  }
  const bundle: CourseBundle = bundleCourse(course);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(bundle, null, 2), "utf8");
  process.stdout.write(
    `content build → ${out} (${bundle.stats.lessonCount} lessons, ${bundle.stats.taskCount} tasks)\n`,
  );
  return 0;
}

async function runSync(dir: string): Promise<number> {
  if (!process.env.DATABASE_URL) fail("sync requires DATABASE_URL");
  const course = loadCourse(dir);
  if (summarize(lintCourse(course)).errors > 0) fail("refusing to sync: content has lint errors");
  const bundle = bundleCourse(course);
  const { syncBundle } = await import("./sync");
  const result = await syncBundle(bundle);
  process.stdout.write(`content sync: ${result.lessons} lessons upserted\n`);
  return 0;
}

async function main(): Promise<number> {
  const [cmd, dir, ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const outIdx = rest.indexOf("--out");
  const out = outIdx >= 0 ? rest[outIdx + 1] : undefined;

  if (!cmd || !dir) fail("usage: content <lint|build|sync|test> <courseDir> [--out file] [--strict]");

  switch (cmd) {
    case "lint":
      return runLint(dir, flags.has("--strict"));
    case "build":
      if (!out) fail("build requires --out <file>");
      return runBuild(dir, out);
    case "sync":
      return runSync(dir);
    case "test": {
      // Lint first, then run each task's checks against its reference solution.
      const lintCode = runLint(dir, false);
      if (lintCode !== 0) return lintCode;
      const course = loadCourse(dir);
      const { testCourse } = await import("./test-runner");
      const report = await testCourse(course);
      for (const r of report.results.filter((x) => !x.passed)) {
        for (const f of r.failures) {
          process.stdout.write(`  ✖ ${r.lessonId}/${r.taskId} [${f.checkId}]: ${f.onFail ?? ""} (got ${f.actual ?? "—"})\n`);
        }
      }
      for (const r of report.results) {
        for (const b of r.broken) {
          process.stdout.write(
            `  ✖ ${r.taskId} [${b.checkId}]: the check itself threw — ${b.raw ?? "no detail"}\n`,
          );
        }
      }
      for (const taskId of report.noOpTasks) {
        process.stdout.write(
          `  ✖ ${taskId}: the starter already passes every check — nothing for the student to do\n`,
        );
      }
      process.stdout.write(
        `content test: ${report.passedTasks}/${report.totalTasks} reference solutions pass their checks, ` +
          `${report.totalTasks - report.noOpTasks.length}/${report.totalTasks} starters fail as they should\n`,
      );
      return report.ok ? 0 : 1;
    }
    default:
      fail(`unknown command: ${cmd}`);
  }
}

main()
  .then((code) => process.exit(code))
  .catch((e) => fail(e instanceof Error ? e.message : String(e)));
