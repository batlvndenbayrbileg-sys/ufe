// Copies the SQLite runtime (sql.js, asm build) into public/lib so the preview
// can fetch it on demand. It is ~1.4 MB, so it must never be bundled — the SQL
// lessons pull it over the network once and the rest of the app never sees it.
//
// Run from `dev` and `build`; the copy is skipped when it is already current.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "public", "lib", "sqlite.js");

const require_ = createRequire(import.meta.url);
let src;
try {
  src = require_.resolve("sql.js/dist/sql-asm.js");
} catch {
  console.error("vendor-sqlite: sql.js is not installed; SQL lessons will not run");
  process.exit(0); // not fatal for the rest of the app
}

if (existsSync(dest) && statSync(dest).size === statSync(src).size) {
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`vendor-sqlite: ${(statSync(dest).size / 1024 / 1024).toFixed(2)} MB → public/lib/sqlite.js`);
