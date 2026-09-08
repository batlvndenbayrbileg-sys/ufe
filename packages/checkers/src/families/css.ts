import { registerChecker, runChecks } from "../registry";
import { fail, pass, type CheckDef, type CheckerContext } from "../types";

function gcs(ctx: CheckerContext, el: Element): CSSStyleDeclaration {
  if (ctx.getComputedStyle) return ctx.getComputedStyle(el);
  if (ctx.window) return ctx.window.getComputedStyle(el);
  throw new Error("no getComputedStyle in context");
}

function firstEl(ctx: CheckerContext, selector: string): Element | null {
  if (!ctx.document) throw new Error("no document in context");
  return ctx.document.querySelector(selector);
}

// ── colour parsing for contrast ──────────────────────────────────────────────
function parseColor(input: string): [number, number, number] | null {
  const s = input.trim();
  let m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1]!;
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return null;
}
function luminance([r, g, b]: [number, number, number]): number {
  const ch = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ── css.computed ─────────────────────────────────────────────────────────────
registerChecker("css.computed", (args, ctx) => {
  const el = firstEl(ctx, String(args.selector));
  if (!el) return fail("element not found", String(args.selector));
  const prop = String(args.prop);
  const value = gcs(ctx, el).getPropertyValue(prop).trim();
  if (typeof args.equals === "string") {
    return value === args.equals ? pass({ actual: value }) : fail(value, args.equals);
  }
  if (Array.isArray(args.oneOf)) {
    return (args.oneOf as string[]).includes(value)
      ? pass({ actual: value })
      : fail(value, (args.oneOf as string[]).join(" | "));
  }
  if (typeof args.notEquals === "string") {
    return value !== args.notEquals ? pass({ actual: value }) : fail(value, `not ${args.notEquals}`);
  }
  return pass({ actual: value });
});

// ── css.numeric ──────────────────────────────────────────────────────────────
registerChecker("css.numeric", (args, ctx) => {
  const el = firstEl(ctx, String(args.selector));
  if (!el) return fail("element not found", String(args.selector));
  const prop = String(args.prop);
  const raw = gcs(ctx, el).getPropertyValue(prop).trim();
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return fail(raw || "(none)", "a numeric value");
  const min = typeof args.min === "number" ? args.min : -Infinity;
  const max = typeof args.max === "number" ? args.max : Infinity;
  return num >= min && num <= max ? pass({ actual: raw }) : fail(raw, `${min}–${max}`);
});

// ── css.layout ───────────────────────────────────────────────────────────────
registerChecker("css.layout", (args, ctx) => {
  const el = firstEl(ctx, String(args.selector));
  if (!el) return fail("element not found", String(args.selector));
  const style = gcs(ctx, el);
  const display = style.getPropertyValue("display").trim();
  const mode = String(args.mode);
  if (display !== mode && display !== `inline-${mode}`) {
    return fail(`display: ${display}`, `display: ${mode}`);
  }
  if (typeof args.columns === "number") {
    const cols = style.getPropertyValue("grid-template-columns").trim().split(/\s+/).filter(Boolean).length;
    if (cols !== args.columns) return fail(`${cols} columns`, `${args.columns} columns`);
  }
  return pass({ actual: `display: ${display}` });
});

// ── css.contrast ─────────────────────────────────────────────────────────────
/**
 * The background a colour is actually read against. Most elements set no
 * background of their own, so the honest answer is the nearest ancestor that
 * paints one — and the canvas is white when nothing does.
 */
function effectiveBackground(ctx: CheckerContext, el: Element): [number, number, number] {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const raw = gcs(ctx, node).getPropertyValue("background-color").trim();
    if (!raw || raw === "transparent") continue;
    // rgba(...) with alpha 0 is transparent too.
    const alpha = raw.match(/rgba\(\s*[\d.]+[,\s]+[\d.]+[,\s]+[\d.]+[,\s/]+([\d.]+)/i);
    if (alpha && Number(alpha[1]) === 0) continue;
    const parsed = parseColor(raw);
    if (parsed) return parsed;
  }
  return [255, 255, 255];
}

registerChecker("css.contrast", (args, ctx) => {
  const el = firstEl(ctx, String(args.selector));
  if (!el) return fail("element not found", String(args.selector));
  const style = gcs(ctx, el);
  const fg = parseColor(style.getPropertyValue("color"));
  const bg = effectiveBackground(ctx, el);
  const min = typeof args.min === "number" ? args.min : 4.5;
  // No readable text colour yet (e.g. the student hasn't set one) is a normal
  // failing answer, not a system fault — report it cleanly.
  if (!fg) return fail(style.getPropertyValue("color").trim() || "(тохируулаагүй)", "унших боломжтой текстийн өнгө");
  const ratio = contrast(fg, bg);
  return ratio >= min ? pass({ actual: `${ratio.toFixed(2)}:1` }) : fail(`${ratio.toFixed(2)}:1`, `≥ ${min}:1`);
});

// ── css.noHardcoded (source heuristic) ───────────────────────────────────────
// Forces custom-property use in the tokens lesson: flags literal colours for
// the given props anywhere outside a :root block.
registerChecker("css.noHardcoded", (args, ctx) => {
  const props = (args.props as string[]) ?? ["color", "background", "background-color"];
  const css = Object.entries(ctx.files)
    .filter(([k]) => k.endsWith(".css"))
    .map(([, v]) => v.content)
    .join("\n");
  const withoutRoot = css.replace(/:root\s*\{[^}]*\}/g, "");
  const offenders: string[] = [];
  for (const prop of props) {
    const re = new RegExp(`${prop}\\s*:\\s*(#[0-9a-fA-F]{3,8}|rgb|hsl)`, "gi");
    if (re.test(withoutRoot)) offenders.push(prop);
  }
  return offenders.length === 0
    ? pass()
    : fail(`literal value for ${offenders.join(", ")}`, "CSS custom properties (var(--…))");
});

// ── css.responsive ───────────────────────────────────────────────────────────
// Re-renders the workspace at a viewport and runs child checks there, so media
// queries are actually evaluated (docs/blueprint/05 §5.2).
registerChecker("css.responsive", async (args, ctx) => {
  const viewport = args.viewport as { width: number; height?: number } | undefined;
  const then = (args.then as CheckDef[]) ?? [];
  if (!viewport?.width) return fail("no viewport", "args.viewport.width");
  if (!ctx.renderAt) {
    return { passed: false, errorKind: "infra", raw: "responsive checks need the server runner" };
  }

  const scoped = await ctx.renderAt({ width: viewport.width, height: viewport.height ?? 800 });
  const results = await runChecks(then, scoped);
  const failures = results.filter((r) => !r.passed && r.errorKind !== "infra");

  if (failures.length === 0) {
    return pass({ actual: `${viewport.width}px дээр ${results.length} шалгалт давлаа` });
  }
  const first = failures[0]!;
  return fail(
    `${viewport.width}px: ${first.actual ?? "тохирохгүй"}`,
    `${viewport.width}px: ${first.expected ?? "хүлээгдсэн утга"}`,
  );
});

// ── css.box (geometry — truthful in the browser; happy-dom has no layout) ─────
registerChecker("css.box", (args, ctx) => {
  const el = firstEl(ctx, String(args.selector));
  if (!el) return fail("element not found", String(args.selector));
  const rect = el.getBoundingClientRect();
  if (args.visible === true && (rect.width === 0 || rect.height === 0)) {
    // On the server (no layout) width/height are 0 — don't fail the student.
    if (!ctx.window || !("HTMLElement" in ctx.window)) {
      return { passed: true, errorKind: "infra", raw: "no layout engine (server)" };
    }
    return fail("0×0 (hidden)", "visible");
  }
  const okW = typeof args.widthMin !== "number" || rect.width >= args.widthMin;
  const okH = typeof args.heightMin !== "number" || rect.height >= args.heightMin;
  return okW && okH ? pass({ actual: `${Math.round(rect.width)}×${Math.round(rect.height)}` }) : fail(`${Math.round(rect.width)}×${Math.round(rect.height)}`, "large enough");
});
