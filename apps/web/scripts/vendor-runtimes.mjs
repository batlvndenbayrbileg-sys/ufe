// Copies the two big preview runtimes into public/lib so the browser can fetch
// them on demand. Neither may be bundled: SQLite is ~1.4 MB and React ~180 KB,
// and only a handful of lessons need either. See PreviewHost's fetchRuntime.
//
// Run from `dev`, `build` and `start`; each copy is skipped when already current.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
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
const reactDest = join(libDir, "react-runtime.js");
try {
  // Emitted as a plain asset by @khiye/checkers scripts/build-react-runtime.mjs.
  const src = join(here, "..", "..", "..", "packages", "checkers", "runtime", "react-runtime.js");
  if (!existsSync(reactDest) || statSync(reactDest).size !== statSync(src).size) {
    copyFileSync(src, reactDest);
    console.log(`vendor: ${mb(statSync(reactDest).size)} MB → public/lib/react-runtime.js`);
  }
} catch (problem) {
  console.error("vendor: React runtime unavailable; React lessons will not preview");
  console.error(`  ${problem instanceof Error ? problem.message : problem}`);
  process.exitCode = 1;
}
