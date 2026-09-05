import { describe, expect, it } from "vitest";
import { runCheck } from "../registry";
import "../index";
import type { CheckerContext, FileSet } from "../types";

const files: FileSet = {
  "package.json": {
    content: JSON.stringify(
      {
        name: "shop-mn",
        scripts: { build: "node build.mjs", start: "node server.mjs" },
        engines: { node: ">=22" },
        files: ["dist", "public"],
      },
      null,
      2,
    ),
  },
  ".env.example": { content: "# Хуулж аваад .env болго\nDATABASE_URL=\nSESSION_SECRET=\n" },
  ".gitignore": { content: "node_modules\n.env\n.next\n" },
  "broken.json": { content: "{ not json" },
};

const ctx = { files, consoleErrors: [] } as unknown as CheckerContext;
const run = (type: string, args: Record<string, unknown>) =>
  runCheck({ id: "c", type, args, onFail: { mn: "" } }, ctx);

describe("file.matches", () => {
  it("finds a pattern and reports a miss", async () => {
    expect((await run("file.matches", { file: ".gitignore", pattern: "^\\.env$", flags: "m" })).passed).toBe(true);
    expect((await run("file.matches", { file: ".gitignore", pattern: "^secrets$", flags: "m" })).passed).toBe(false);
  });

  it("asserts absence — the check that keeps a secret out of a file", async () => {
    expect(
      (await run("file.matches", { file: ".env.example", pattern: "SESSION_SECRET=.+", absent: true })).passed,
    ).toBe(true);
    expect(
      (await run("file.matches", { file: ".gitignore", pattern: "node_modules", absent: true })).passed,
    ).toBe(false);
  });

  it("a missing file fails rather than throwing", async () => {
    const r = await run("file.matches", { file: "nope.txt", pattern: "x" });
    expect(r.passed).toBe(false);
    expect(r.errorKind).toBe("assertion");
  });
});

describe("file.json", () => {
  it("reads a dotted path", async () => {
    expect((await run("file.json", { file: "package.json", path: "scripts.build", equals: "node build.mjs" })).passed).toBe(true);
    expect((await run("file.json", { file: "package.json", path: "scripts.build", equals: "wrong" })).passed).toBe(false);
  });

  it("reads array indexes and matches patterns", async () => {
    expect((await run("file.json", { file: "package.json", path: "files[0]", equals: "dist" })).passed).toBe(true);
    expect((await run("file.json", { file: "package.json", path: "engines.node", matches: "^>=\\d+" })).passed).toBe(true);
  });

  it("checks presence and absence", async () => {
    expect((await run("file.json", { file: "package.json", path: "scripts.start", exists: true })).passed).toBe(true);
    expect((await run("file.json", { file: "package.json", path: "scripts.deploy", exists: true })).passed).toBe(false);
    expect((await run("file.json", { file: "package.json", path: "scripts.deploy", exists: false })).passed).toBe(true);
  });

  it("invalid JSON is the student's failure, not an infra error", async () => {
    const r = await run("file.json", { file: "broken.json", path: "a" });
    expect(r.passed).toBe(false);
    expect(r.errorKind).toBe("assertion");
    expect(r.actual).toContain("not valid JSON");
  });
});
