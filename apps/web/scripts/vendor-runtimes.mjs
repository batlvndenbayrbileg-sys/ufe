// Copies the big preview runtimes into public/lib so the browser can fetch
// them on demand. None may be bundled: SQLite is ~1.4 MB and React ~180 KB,
// and only a handful of lessons need either. See PreviewHost's fetchRuntime.
//
// Run from `dev`, `build` and `start`; each copy is skipped when already current.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, "..", "public", "lib");
const require_ = createRequire(import.meta.url);

mkdirSync(libDir, { recursive: true });

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

// ── SQLite (sql.js, asm build) ───────────────────────────────────────────────
const sqliteDest = join(libDir, "sqlite.js");
try {
  const src = require_.resolve("sql.js/dist/sql-asm.js");
  if (!existsSync(sqliteDest) || statSync(sqliteDest).size !== statSync(src).size) {
    copyFileSync(src, sqliteDest);
    console.log(`vendor: ${mb(statSync(sqliteDest).size)} MB → public/lib/sqlite.js`);
  }
} catch {
  console.error("vendor: sql.js is not installed; SQL lessons will not run");
}

// ── React + ReactDOM (the pre-bundled preview runtime) ───────────────────────
// Prefer the plain asset emitted by scripts/build-react-runtime.mjs, but on a
// fresh checkout (the runtime/ dir is gitignored — e.g. Vercel/CI) fall back to
// the committed constant in checkers, so the browser copy is always present.
const reactDest = join(libDir, "react-runtime.js");
try {
  const asset = join(here, "..", "..", "..", "packages", "checkers", "runtime", "react-runtime.js");
  let code;
  if (existsSync(asset)) {
    code = readFileSync(asset, "utf8");
  } else {
    const genPath = join(here, "..", "..", "..", "packages", "checkers", "src", "react-runtime.generated.ts");
    const gen = readFileSync(genPath, "utf8");
    const m = gen.match(/REACT_RUNTIME_JS: string = ("(?:\\.|[^"\\])*");/);
    if (!m) throw new Error("could not read REACT_RUNTIME_JS from react-runtime.generated.ts");
    code = JSON.parse(m[1]);
  }
  if (!existsSync(reactDest) || readFileSync(reactDest, "utf8") !== code) {
    writeFileSync(reactDest, code);
    console.log(`vendor: ${(Buffer.byteLength(code) / 1024).toFixed(0)} KB → public/lib/react-runtime.js`);
  }
} catch (problem) {
  console.error("vendor: React runtime unavailable; React lessons will not preview");
  console.error(`  ${problem instanceof Error ? problem.message : problem}`);
  process.exitCode = 1;
}

// ── React Native → DOM teaching shim ─────────────────────────────────────────
// The browser copy is derived from the committed constant in checkers so it is
// always present (even on a fresh CI checkout) and can never drift from the
// source the server grader inlines. ~10 KB, only React Native lessons fetch it.
const rnDest = join(libDir, "rn-runtime.js");
try {
  const genPath = join(here, "..", "..", "..", "packages", "checkers", "src", "rn-runtime.generated.ts");
  const gen = readFileSync(genPath, "utf8");
  const m = gen.match(/RN_RUNTIME_JS: string = ("(?:\\.|[^"\\])*");/);
  if (!m) throw new Error("could not read RN_RUNTIME_JS from rn-runtime.generated.ts");
  const code = JSON.parse(m[1]);
  if (!existsSync(rnDest) || readFileSync(rnDest, "utf8") !== code) {
    writeFileSync(rnDest, code);
    console.log(`vendor: ${(Buffer.byteLength(code) / 1024).toFixed(1)} KB → public/lib/rn-runtime.js`);
  }
} catch (problem) {
  console.error("vendor: React Native shim unavailable; RN lessons will not preview");
  console.error(`  ${problem instanceof Error ? problem.message : problem}`);
  process.exitCode = 1;
}
