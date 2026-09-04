import { registerChecker } from "../registry";
import { fail, pass, type CheckerContext } from "../types";

function win(ctx: CheckerContext): Window & typeof globalThis {
  if (!ctx.window) throw new Error("no window in context");
  return ctx.window;
}
function doc(ctx: CheckerContext): Document {
  if (!ctx.document) throw new Error("no document in context");
  return ctx.document;
}

/** Evaluate an expression in the page's global scope (so it sees student globals). */
function evalInPage(ctx: CheckerContext, setup: string | undefined, expr: string): unknown {
  const w = win(ctx) as unknown as { eval: (s: string) => unknown };
  const code = `(function(){ ${setup ? setup + ";" : ""} return (${expr}); })()`;
  return w.eval(code);
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// ── js.evaluate ──────────────────────────────────────────────────────────────
registerChecker("js.evaluate", (args, ctx) => {
  const result = evalInPage(ctx, args.setup as string | undefined, String(args.expr));
  if ("equals" in args) {
    const eq = stringify(result) === stringify(args.equals);
    return eq ? pass({ actual: stringify(result) }) : fail(stringify(result), stringify(args.equals));
  }
  if (typeof args.matches === "string") {
    return new RegExp(args.matches, "u").test(String(result))
      ? pass({ actual: String(result) })
      : fail(String(result), `/${args.matches}/`);
  }
  return result ? pass({ actual: stringify(result) }) : fail(stringify(result), "a truthy value");
});

// ── js.consoleClean ──────────────────────────────────────────────────────────
registerChecker("js.consoleClean", (args, ctx) => {
  const allow = (args.allow as string[]) ?? [];
  const errors = ctx.consoleErrors.filter((e) => !allow.some((a) => e.includes(a)));
  return errors.length === 0
    ? pass()
    : fail(errors[0], "no uncaught errors in the console");
});

// ── js.interaction ───────────────────────────────────────────────────────────
interface Step {
  click?: string;
  type?: { selector: string; text: string };
  waitFor?: string;
  expectText?: { selector: string; equals?: string; contains?: string };
  /** Assert how many elements match — proves list/state logic (e.g. a repeated
   *  add must update a quantity, not append a second row). */
  expectCount?: { selector: string; equals: number };
  expectEval?: { expr: string; equals: unknown };
}

async function waitFor(ctx: CheckerContext, selector: string, capMs = 3000): Promise<Element | null> {
  const start = Date.now();
  while (Date.now() - start < capMs) {
    const el = doc(ctx).querySelector(selector);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 20));
  }
  return null;
}

/**
 * Set a form control's value the way a keystroke would.
 *
 * React installs a value tracker on the node and replaces the instance's `value`
 * property; assigning `el.value` goes through that setter, which updates the
 * tracker, so React concludes nothing changed and drops the event — a controlled
 * input would silently ignore the check. Writing through the pristine PROTOTYPE
 * setter leaves the tracker stale, which is exactly what a real keystroke does.
 */
function setValue(w: Window & typeof globalThis, el: Element, value: string): void {
  const proto =
    el.tagName === "TEXTAREA"
      ? w.HTMLTextAreaElement?.prototype
      : el.tagName === "SELECT"
        ? w.HTMLSelectElement?.prototype
        : w.HTMLInputElement?.prototype;
  const setter = proto && Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else (el as HTMLInputElement).value = value;
}

/**
 * Poll an assertion until it holds or the cap elapses. Frameworks (React et al.)
 * flush state updates asynchronously, so reading the DOM immediately after a
 * click is a race. Polling keeps interaction checks framework-agnostic.
 */
async function until(predicate: () => boolean, capMs = 1000): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    if (predicate()) return true;
    if (Date.now() - start >= capMs) return false;
    await new Promise((r) => setTimeout(r, 15));
  }
}

registerChecker("js.interaction", async (args, outerCtx) => {
  const steps = (args.steps as Step[]) ?? [];
  // Each interaction check is an ISOLATED scenario: re-render the page so
  // clicks from a previous check never leak into this one. (Without this,
  // several interaction checks on one task silently accumulate state.)
  const ctx =
    args.fresh === false || !outerCtx.renderAt
      ? outerCtx
      : await outerCtx.renderAt({ width: 1280, height: 800 });
  const w = win(ctx);
  for (const [i, step] of steps.entries()) {
    if (step.click !== undefined) {
      const el = doc(ctx).querySelector(step.click);
      if (!el) return fail(`step ${i + 1}: no element ${step.click}`, "clickable element");
      el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    } else if (step.type !== undefined) {
      const el = doc(ctx).querySelector<HTMLInputElement>(step.type.selector);
      if (!el) return fail(`step ${i + 1}: no input ${step.type.selector}`, "an input");
      setValue(w, el, step.type.text);
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
      el.dispatchEvent(new w.Event("change", { bubbles: true }));
    } else if (step.waitFor !== undefined) {
      const el = await waitFor(ctx, step.waitFor);
      if (!el) return fail(`step ${i + 1}: ${step.waitFor} never appeared`, "element to appear");
    } else if (step.expectText !== undefined) {
      const want = step.expectText;
      const read = () => (doc(ctx).querySelector(want.selector)?.textContent ?? "").trim();
      const ok = await until(() => {
        const t = read();
        if (want.equals !== undefined) return t === want.equals;
        if (want.contains !== undefined) return t.includes(want.contains);
        return t.length > 0;
      });
      if (!ok) {
        const text = read();
        return fail(
          text || "(none)",
          want.equals ?? (want.contains !== undefined ? `contains "${want.contains}"` : "текст"),
        );
      }
    } else if (step.expectCount !== undefined) {
      const want = step.expectCount;
      const count = () => doc(ctx).querySelectorAll(want.selector).length;
      const ok = await until(() => count() === want.equals);
      if (!ok) {
        return fail(`${want.selector}: ${count()}`, `${want.selector}: ${want.equals}`);
      }
    } else if (step.expectEval !== undefined) {
      // Poll like the DOM assertions do: an effect (useEffect, a queued save)
      // lands a tick after the click that triggered it.
      const want = stringify(step.expectEval.equals);
      const read = () => {
        try {
          return stringify(evalInPage(ctx, undefined, step.expectEval!.expr));
        } catch (e) {
          // Keep polling: the value the expression reads may not exist yet.
          return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        }
      };
      if (!(await until(() => read() === want))) return fail(read(), want);
    }
  }
  return pass();
});
