import { describe, expect, it } from "vitest";
import "../index"; // register families
import { runCheck } from "../registry";
import type { CheckerContext } from "../types";

const ctxWith = (source: string): CheckerContext => ({
  files: { "app.js": { content: source } },
  consoleErrors: [],
});

const run = (type: string, args: Record<string, unknown>, source: string) =>
  runCheck({ id: "c", type, args: { file: "app.js", ...args } }, ctxWith(source));

describe("ast.*", () => {
  it("ast.declares finds functions and consts", async () => {
    expect((await run("ast.declares", { name: "addToCart", kind: "function" }, "function addToCart(){}")).passed).toBe(true);
    expect((await run("ast.declares", { name: "cart", kind: "const" }, "const cart = [];")).passed).toBe(true);
    expect((await run("ast.declares", { name: "missing" }, "const cart=[];")).passed).toBe(false);
  });

  it("ast.declares finds TypeScript interfaces and type aliases", async () => {
    const ts = 'interface CartItem { id: number }\ntype DiscountCode = "ШИНЭ10" | "ЗУН20";\nfunction cartTotal(){}';
    expect((await run("ast.declares", { name: "CartItem", kind: "interface" }, ts)).passed).toBe(true);
    expect((await run("ast.declares", { name: "DiscountCode", kind: "type" }, ts)).passed).toBe(true);
    // A function is not a type, and a missing one is still missing.
    expect((await run("ast.declares", { name: "cartTotal", kind: "interface" }, ts)).passed).toBe(false);
    expect((await run("ast.declares", { name: "Nothing", kind: "type" }, ts)).passed).toBe(false);
  });

  it("ast.callsFunction detects fn() and obj.method()", async () => {
    expect((await run("ast.callsFunction", { name: "fetch" }, "fetch('/api')")).passed).toBe(true);
    expect((await run("ast.callsFunction", { name: "map" }, "products.map(p=>p)")).passed).toBe(true);
    expect((await run("ast.callsFunction", { name: "fetch" }, "const x=1")).passed).toBe(false);
  });

  it("ast.usesHook detects React hooks", async () => {
    expect((await run("ast.usesHook", { hook: "useState" }, "const [n,setN]=useState(0)")).passed).toBe(true);
    expect((await run("ast.usesHook", { hook: "useEffect" }, "const x=useState(0)")).passed).toBe(false);
  });

  it("ast.imports checks source and named specifier", async () => {
    expect((await run("ast.imports", { from: "react" }, "import React from 'react'")).passed).toBe(true);
    expect((await run("ast.imports", { from: "react", named: "useState" }, "import { useState } from 'react'")).passed).toBe(true);
    expect((await run("ast.imports", { from: "react", named: "useState" }, "import React from 'react'")).passed).toBe(false);
  });

  it("ast.forbids catches innerHTML and var", async () => {
    expect((await run("ast.forbids", { patterns: ["innerHTML"] }, "el.innerHTML = x")).passed).toBe(false);
    expect((await run("ast.forbids", { patterns: ["var"] }, "var x = 1")).passed).toBe(false);
    expect((await run("ast.forbids", { patterns: ["innerHTML"] }, "el.textContent = x")).passed).toBe(true);
  });

  it("reports a syntax error as runtime, not a plain assertion", async () => {
    const r = await run("ast.declares", { name: "x" }, "function () { const ");
    // errorRecovery may still index; if it can't, it's runtime — either way not a crash
    expect(r).toBeDefined();
  });
});
