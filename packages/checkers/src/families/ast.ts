import { parse } from "@babel/parser";
import { registerChecker } from "../registry";
import { fail, pass, type CheckerContext } from "../types";

interface AstNode {
  type: string;
  [k: string]: unknown;
}

interface AstIndex {
  ok: boolean;
  error?: string;
  callNames: Set<string>; // fn() and obj.fn() callee names
  memberProps: Set<string>;
  identifiers: Set<string>;
  functionNames: Set<string>;
  constNames: Set<string>;
  hasVar: boolean;
  imports: Map<string, Set<string>>; // source → named specifiers
}

function walk(node: unknown, visit: (n: AstNode) => void): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const c of node) walk(c, visit);
    return;
  }
  const n = node as AstNode;
  if (typeof n.type === "string") visit(n);
  for (const key of Object.keys(n)) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
    walk((n as Record<string, unknown>)[key], visit);
  }
}

function indexFile(source: string): AstIndex {
  const idx: AstIndex = {
    ok: true,
    callNames: new Set(),
    memberProps: new Set(),
    identifiers: new Set(),
    functionNames: new Set(),
    constNames: new Set(),
    hasVar: false,
    imports: new Map(),
  };
  let ast;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    });
  } catch (e) {
    return { ...idx, ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  walk(ast.program, (n) => {
    switch (n.type) {
      case "Identifier":
        idx.identifiers.add(n.name as string);
        break;
      case "MemberExpression": {
        const prop = n.property as AstNode;
        if (prop?.type === "Identifier") idx.memberProps.add(prop.name as string);
        break;
      }
      case "CallExpression": {
        const callee = n.callee as AstNode;
        if (callee?.type === "Identifier") idx.callNames.add(callee.name as string);
        else if (callee?.type === "MemberExpression") {
          const prop = callee.property as AstNode;
          if (prop?.type === "Identifier") idx.callNames.add(prop.name as string);
        }
        break;
      }
      case "FunctionDeclaration": {
        const id = n.id as AstNode | null;
        if (id?.type === "Identifier") idx.functionNames.add(id.name as string);
        break;
      }
      case "VariableDeclaration": {
        if (n.kind === "var") idx.hasVar = true;
        if (n.kind === "const") {
          for (const d of n.declarations as AstNode[]) {
            const id = d.id as AstNode;
            if (id?.type === "Identifier") idx.constNames.add(id.name as string);
          }
        }
        break;
      }
      case "ImportDeclaration": {
        const src = (n.source as AstNode)?.value as string;
        const named = idx.imports.get(src) ?? new Set<string>();
        for (const spec of (n.specifiers as AstNode[]) ?? []) {
          const imported = spec.imported as AstNode | undefined;
          if (imported?.type === "Identifier") named.add(imported.name as string);
        }
        idx.imports.set(src, named);
        break;
      }
    }
  });
  return idx;
}

function fileSource(ctx: CheckerContext, file: string): string | null {
  return ctx.files[file]?.content ?? null;
}

function withIndex(
  ctx: CheckerContext,
  file: string,
  fn: (idx: AstIndex) => ReturnType<typeof pass>,
): ReturnType<typeof pass> {
  const src = fileSource(ctx, file);
  if (src === null) return fail("file not found", file);
  const idx = indexFile(src);
  if (!idx.ok) return { passed: false, errorKind: "runtime", raw: idx.error, actual: "syntax error" };
  return fn(idx);
}

// ── ast.declares ─────────────────────────────────────────────────────────────
registerChecker("ast.declares", (args, ctx) =>
  withIndex(ctx, String(args.file), (idx) => {
    const name = String(args.name);
    const kind = args.kind as string | undefined;
    const found =
      (kind !== "const" && idx.functionNames.has(name)) ||
      (kind !== "function" && idx.constNames.has(name));
    return found ? pass({ actual: name }) : fail("not declared", `${kind ?? ""} ${name}`.trim());
  }),
);

// ── ast.callsFunction ────────────────────────────────────────────────────────
registerChecker("ast.callsFunction", (args, ctx) =>
  withIndex(ctx, String(args.file), (idx) => {
    const name = String(args.name);
    return idx.callNames.has(name) ? pass({ actual: `${name}(...) called` }) : fail("not called", `${name}(...)`);
  }),
);

// ── ast.usesHook ─────────────────────────────────────────────────────────────
registerChecker("ast.usesHook", (args, ctx) =>
  withIndex(ctx, String(args.file), (idx) => {
    const hook = String(args.hook);
    return idx.callNames.has(hook) ? pass({ actual: `${hook}()` }) : fail("not used", `${hook}()`);
  }),
);

// ── ast.imports ──────────────────────────────────────────────────────────────
registerChecker("ast.imports", (args, ctx) =>
  withIndex(ctx, String(args.file), (idx) => {
    const from = String(args.from);
    const named = idx.imports.get(from);
    if (!named) return fail("not imported", `import from "${from}"`);
    if (typeof args.named === "string" && !named.has(args.named)) {
      return fail(`from "${from}" without ${args.named}`, `{ ${args.named} } from "${from}"`);
    }
    return pass({ actual: `import from "${from}"` });
  }),
);

// ── ast.forbids ──────────────────────────────────────────────────────────────
registerChecker("ast.forbids", (args, ctx) =>
  withIndex(ctx, String(args.file), (idx) => {
    const patterns = (args.patterns as string[]) ?? [];
    const found = patterns.filter((p) => {
      if (p === "var") return idx.hasVar;
      return idx.memberProps.has(p) || idx.identifiers.has(p) || idx.callNames.has(p);
    });
    return found.length === 0
      ? pass()
      : fail(`used ${found.join(", ")}`, `no ${patterns.join(", ")}`);
  }),
);
