import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../lib/contrast";

/**
 * T1.1 acceptance: every meaningful text/background pair meets WCAG AA in
 * BOTH the light and dark palettes. Parses tokens.css so the test tracks the
 * real values — change a token and the gate re-checks it.
 */

const cssPath = fileURLToPath(new URL("./tokens.css", import.meta.url));
const css = readFileSync(cssPath, "utf8");

/** Extract a balanced `{ ... }` block starting at the given selector. */
function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`unbalanced block for ${selector}`);
}

function palette(selector: string): Record<string, string> {
  const body = block(selector);
  const map: Record<string, string> = {};
  const re = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) map[m[1]!] = m[2]!;
  return map;
}

const light = palette(":root {");
const dark = palette(':root[data-theme="dark"] {');

// [foreground, background, minRatio]
const PAIRS: Array<[string, string, number]> = [
  ["--text", "--bg", 7],
  ["--text", "--surface", 7],
  ["--text", "--surface-2", 7],
  ["--text-muted", "--surface", 4.5],
  ["--text-muted", "--bg", 4.5],
  ["--accent-text", "--accent-subtle", 4.5],
  ["--on-accent", "--accent", 4.5],
  ["--success", "--success-subtle", 4.5],
  ["--danger", "--danger-subtle", 4.5],
  ["--warning", "--warning-subtle", 4.5],
  ["--info", "--info-subtle", 4.5],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("token contrast (%s)", (_name, pal) => {
  it("defines every referenced token", () => {
    for (const [fg, bg] of PAIRS) {
      expect(pal[fg], `${fg} missing`).toBeDefined();
      expect(pal[bg], `${bg} missing`).toBeDefined();
    }
  });

  it.each(PAIRS)("%s on %s ≥ %f:1", (fg, bg, min) => {
    const ratio = contrastRatio(pal[fg]!, pal[bg]!);
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });
});
