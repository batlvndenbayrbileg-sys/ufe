// Measures the first-load JavaScript of the lesson shell, gzipped, and fails
// over budget. The blueprint (11-system-architecture §11.7) puts the ceiling at
// 400 KB gz: this is the page a student on a Mongolian mobile connection waits
// for before they can type anything.
//
// Usage: node scripts/bundlesize.mjs [--budget 400] [--route /learn/[lessonId]]
import { gzipSync } from "node:zlib";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const ROUTE = flag("route", "/learn/[lessonId]");
const BUDGET_KB = Number(flag("budget", "400"));
const NEXT = join(process.cwd(), ".next");

let manifest;
try {
  manifest = JSON.parse(readFileSync(join(NEXT, "app-build-manifest.json"), "utf8"));
} catch {
  console.error("bundlesize: no .next/app-build-manifest.json — run `next build` first");
  process.exit(1);
}

const key = Object.keys(manifest.pages).find((k) => k === `${ROUTE}/page` || k === ROUTE);
if (!key) {
  console.error(`bundlesize: route ${ROUTE} not in the build manifest`);
  console.error(`  known: ${Object.keys(manifest.pages).join(", ")}`);
  process.exit(1);
}

// Every file the route loads on first paint, deduped; only the JavaScript counts.
const files = [...new Set(manifest.pages[key])].filter((f) => f.endsWith(".js"));

let total = 0;
const rows = [];
for (const file of files) {
  const path = join(NEXT, file);
  try {
    const gz = gzipSync(readFileSync(path)).length;
    total += gz;
    rows.push({ file, raw: statSync(path).size, gz });
  } catch {
    console.error(`bundlesize: cannot read ${file}`);
    process.exit(1);
  }
}

rows.sort((a, b) => b.gz - a.gz);
const kb = (n) => (n / 1024).toFixed(1).padStart(7);

console.log(`bundlesize — ${ROUTE}\n`);
for (const r of rows) {
  console.log(`  ${kb(r.gz)} KB gz  ${kb(r.raw)} KB raw  ${r.file}`);
}

const totalKb = total / 1024;
console.log(`\n  ${kb(total)} KB gz  TOTAL first-load JS (budget ${BUDGET_KB} KB)`);

if (totalKb > BUDGET_KB) {
  console.error(`\n✖ over budget by ${(totalKb - BUDGET_KB).toFixed(1)} KB`);
  process.exit(1);
}

console.log(`\n✓ ${(BUDGET_KB - totalKb).toFixed(1)} KB of headroom`);
