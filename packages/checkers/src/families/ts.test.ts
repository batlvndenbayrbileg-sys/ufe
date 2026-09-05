import { describe, expect, it } from "vitest";
import { runCheck } from "../registry";
import "../server"; // registers the Node-only families
import type { CheckerContext, FileSet } from "../types";

const ctxFor = (files: FileSet) => ({ files, consoleErrors: [] }) as unknown as CheckerContext;
const run = (type: string, args: Record<string, unknown>, files: FileSet) =>
  runCheck({ id: "c", type, args, onFail: { mn: "" } }, ctxFor(files));

describe("ts.typecheck", () => {
  it("passes well-typed code", async () => {
    const r = await run(
      "ts.typecheck",
      {},
      { "src/cart.ts": { content: "export const total = (n: number): number => n * 2;\n" } },
    );
    expect(r.passed).toBe(true);
  });

  it("reports a real type error with its location", async () => {
    const r = await run(
      "ts.typecheck",
      {},
      { "src/cart.ts": { content: 'const price: number = "129000";\nexport { price };\n' } },
    );
    expect(r.passed).toBe(false);
    expect(r.errorKind).toBe("assertion");
    expect(r.actual).toContain("src/cart.ts:1");
    expect(r.actual).toContain("TS2322");
  });

  it("enforces strict null checks", async () => {
    const r = await run(
      "ts.typecheck",
      {},
      {
        "src/cart.ts": {
          content: "export function name(p: { name?: string }): number {\n  return p.name.length;\n}\n",
        },
      },
    );
    expect(r.passed).toBe(false);
  });

  it("only looks at TypeScript", async () => {
    const r = await run("ts.typecheck", {}, { "src/app.js": { content: "const x: = ;" } });
    expect(r.passed).toBe(false);
    expect(r.expected).toContain(".ts");
  });
});

describe("ts.rejects", () => {
  const product = (body: string): FileSet => ({ "src/types.ts": { content: body } });

  it("passes when a real type refuses a wrong value", async () => {
    const r = await run(
      "ts.rejects",
      { file: "src/types.ts", code: 'const bad: Product = { id: "нэг", name: "Дээл" };' },
      product("export interface Product {\n  id: number;\n  name: string;\n}\n"),
    );
    expect(r.passed).toBe(true);
  });

  it("fails when the type is `any` and proves nothing", async () => {
    // The point of the check: ts.typecheck alone would happily pass this.
    const r = await run(
      "ts.rejects",
      { file: "src/types.ts", code: 'const bad: Product = { id: "нэг", name: "Дээл" };' },
      product("export type Product = any;\n"),
    );
    expect(r.passed).toBe(false);
    expect(r.actual).toContain("accepted");
  });

  it("can require a specific diagnostic code", async () => {
    const files = product("export interface Product {\n  id: number;\n}\n");
    const ok = await run(
      "ts.rejects",
      { file: "src/types.ts", code: 'const bad: Product = { id: "нэг" };', expectCode: 2322 },
      files,
    );
    expect(ok.passed).toBe(true);

    const wrong = await run(
      "ts.rejects",
      { file: "src/types.ts", code: 'const bad: Product = { id: "нэг" };', expectCode: 9999 },
      files,
    );
    expect(wrong.passed).toBe(false);
  });
});
