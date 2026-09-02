import { registerChecker } from "../registry";
import { fail, pass, type CheckerContext } from "../types";

function doc(ctx: CheckerContext): Document {
  if (!ctx.document) throw new Error("no document in context");
  return ctx.document;
}

function normalize(s: string, opts: { trim?: boolean; normalizeWhitespace?: boolean }): string {
  let out = s;
  if (opts.normalizeWhitespace !== false) out = out.replace(/\s+/g, " ");
  if (opts.trim !== false) out = out.trim();
  return out;
}

const clip = (s: string, n = 160): string => (s.length > n ? s.slice(0, n) + "…" : s);

// ── dom.exists ───────────────────────────────────────────────────────────────
registerChecker("dom.exists", (args, ctx) => {
  const selector = String(args.selector);
  const min = typeof args.min === "number" ? args.min : 1;
  const max = typeof args.max === "number" ? args.max : Infinity;
  const n = doc(ctx).querySelectorAll(selector).length;
  if (n >= min && n <= max) return pass({ actual: `${n} matched` });
  return fail(`${n} matched`, `between ${min} and ${max === Infinity ? "∞" : max}`);
});

// ── dom.notExists ────────────────────────────────────────────────────────────
registerChecker("dom.notExists", (args, ctx) => {
  const selector = String(args.selector);
  const n = doc(ctx).querySelectorAll(selector).length;
  return n === 0 ? pass() : fail(`${n} found`, "0");
});

// ── dom.count ────────────────────────────────────────────────────────────────
registerChecker("dom.count", (args, ctx) => {
  const selector = String(args.selector);
  const n = doc(ctx).querySelectorAll(selector).length;
  if (typeof args.equals === "number") {
    return n === args.equals ? pass({ actual: `${n}` }) : fail(`${n}`, `${args.equals}`);
  }
  const min = typeof args.min === "number" ? args.min : 0;
  const max = typeof args.max === "number" ? args.max : Infinity;
  return n >= min && n <= max ? pass({ actual: `${n}` }) : fail(`${n}`, `${min}–${max}`);
});

// ── dom.text ─────────────────────────────────────────────────────────────────
registerChecker("dom.text", (args, ctx) => {
  const selector = String(args.selector);
  const el = doc(ctx).querySelector(selector);
  if (!el) return fail("element not found", `an element matching ${selector}`);
  const text = normalize(el.textContent ?? "", {
    trim: args.trim !== false,
    normalizeWhitespace: args.normalizeWhitespace !== false,
  });
  if (typeof args.equals === "string") {
    return text === args.equals ? pass({ actual: clip(text) }) : fail(clip(text), args.equals);
  }
  if (typeof args.contains === "string") {
    return text.includes(args.contains)
      ? pass({ actual: clip(text) })
      : fail(clip(text), `text containing "${args.contains}"`);
  }
  if (typeof args.matches === "string") {
    return new RegExp(args.matches, "u").test(text)
      ? pass({ actual: clip(text) })
      : fail(clip(text), `text matching /${args.matches}/`);
  }
  return text.length > 0 ? pass({ actual: clip(text) }) : fail("(empty)", "non-empty text");
});

// ── dom.attr ─────────────────────────────────────────────────────────────────
registerChecker("dom.attr", (args, ctx) => {
  const selector = String(args.selector);
  const name = String(args.name);
  const el = doc(ctx).querySelector(selector);
  if (!el) return fail("element not found", `an element matching ${selector}`);
  const value = el.getAttribute(name);
  if (args.exists === true) {
    return value !== null ? pass({ actual: `${name}="${clip(value)}"` }) : fail("(absent)", `${name} present`);
  }
  if (value === null) return fail("(absent)", `${name} attribute`);
  if (typeof args.equals === "string") {
    return value === args.equals ? pass({ actual: value }) : fail(value, args.equals);
  }
  if (typeof args.contains === "string") {
    return value.includes(args.contains) ? pass({ actual: clip(value) }) : fail(clip(value), `contains "${args.contains}"`);
  }
  if (typeof args.minLength === "number") {
    return value.trim().length >= args.minLength
      ? pass({ actual: clip(value) })
      : fail(`length ${value.trim().length}`, `≥ ${args.minLength} chars`);
  }
  return pass({ actual: clip(value) });
});

// ── dom.hierarchy ────────────────────────────────────────────────────────────
registerChecker("dom.hierarchy", (args, ctx) => {
  const parent = String(args.parent);
  const child = String(args.child);
  const combinator = args.direct === true ? " > " : " ";
  const n = doc(ctx).querySelectorAll(`${parent}${combinator}${child}`).length;
  return n > 0 ? pass({ actual: `${n} nested` }) : fail("0 nested", `${child} inside ${parent}`);
});

// ── dom.order ────────────────────────────────────────────────────────────────
registerChecker("dom.order", (args, ctx) => {
  const selectors = (args.selectors as string[]) ?? [];
  const d = doc(ctx);
  const nodes = selectors.map((s) => d.querySelector(s));
  const missing = selectors.find((_, i) => nodes[i] === null);
  if (missing) return fail(`missing ${missing}`, "all selectors present in order");
  const all = [...d.querySelectorAll("*")];
  const positions = nodes.map((n) => all.indexOf(n as Element));
  const ordered = positions.every((p, i) => i === 0 || p > positions[i - 1]!);
  return ordered ? pass() : fail("out of order", selectors.join(" → "));
});

// ── dom.formField ────────────────────────────────────────────────────────────
registerChecker("dom.formField", (args, ctx) => {
  const name = String(args.name);
  const d = doc(ctx);
  const field = d.querySelector<HTMLInputElement>(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
  if (!field) return fail("not found", `a field named "${name}"`);
  if (typeof args.type === "string" && field.getAttribute("type") !== args.type) {
    return fail(`type="${field.getAttribute("type")}"`, `type="${args.type}"`);
  }
  if (args.required === true && !field.hasAttribute("required")) {
    return fail("not required", "required");
  }
  if (args.labelled === true) {
    const id = field.getAttribute("id");
    const hasLabel =
      (id && d.querySelector(`label[for="${id}"]`)) ||
      field.closest("label") !== null ||
      field.hasAttribute("aria-label");
    if (!hasLabel) return fail("no label", "an associated <label> or aria-label");
  }
  return pass();
});

// ── dom.a11y (subset) ────────────────────────────────────────────────────────
registerChecker("dom.a11y", (args, ctx) => {
  const rules = (args.rules as string[]) ?? ["image-alt", "button-name"];
  const d = doc(ctx);
  const violations: string[] = [];

  if (rules.includes("image-alt")) {
    for (const img of d.querySelectorAll("img")) {
      if (!img.hasAttribute("alt")) violations.push(`<img> without alt: ${clip(img.getAttribute("src") ?? "")}`);
    }
  }
  if (rules.includes("button-name")) {
    for (const btn of d.querySelectorAll("button")) {
      const name = (btn.textContent ?? "").trim() || btn.getAttribute("aria-label");
      if (!name) violations.push("<button> without an accessible name");
    }
  }
  if (rules.includes("label")) {
    for (const input of d.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]), textarea, select')) {
      const id = input.getAttribute("id");
      const labelled =
        (id && d.querySelector(`label[for="${id}"]`)) ||
        input.closest("label") !== null ||
        input.hasAttribute("aria-label");
      if (!labelled) violations.push("form field without a label");
    }
  }
  if (rules.includes("heading-order")) {
    let last = 0;
    for (const h of d.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const level = Number(h.tagName[1]);
      if (last && level > last + 1) violations.push(`heading jumps h${last}→h${level}`);
      last = level;
    }
  }

  return violations.length === 0
    ? pass()
    : fail(clip(violations.join("; ")), "no accessibility violations");
});
