import createNextIntlPlugin from "next-intl/plugin";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// The monorepo root (apps/web → ../../). Used as the file-tracing root so a
// serverless function on Vercel includes the pnpm-hoisted node_modules.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Native/generated runtime files that Next's tracer cannot infer from static
// require() analysis. Paths are relative to this app dir and resolve into the
// FLAT hoisted repo-root node_modules (see node-linker=hoisted in .npmrc).
const PRISMA_RUNTIME_FILES = [
  "../../node_modules/.prisma/client/**/*",
  "../../node_modules/@prisma/client/**/*",
  "../../node_modules/@node-rs/argon2/**/*",
  "../../node_modules/@node-rs/argon2-*/**/*",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Trace server dependencies from the WORKSPACE root, not apps/web. Without
  // this, Vercel's function bundle misses @prisma/client (and its query engine)
  // which live in the pnpm virtual store two levels up → "Cannot find module
  // '@prisma/client'" at runtime.
  outputFileTracingRoot: repoRoot,
  // Belt-and-suspenders: force the generated Prisma client + query engine and
  // the argon2 native binding into every API route's trace. With
  // `node-linker=hoisted` (.npmrc) the packages live FLAT at the repo-root
  // node_modules — NOT under the version-suffixed .pnpm store — so the globs
  // must point there. Two keys cover single- and multi-segment API routes
  // (e.g. /api/health and /api/auth/register) since picomatch `**/*` needs a
  // slash. Without the correct paths nft traces nothing and the function fails
  // at runtime with "Cannot find module '@prisma/client'".
  outputFileTracingIncludes: {
    "/api/**": PRISMA_RUNTIME_FILES,
    "/api/**/*": PRISMA_RUNTIME_FILES,
  },
  // Workspace packages ship as TypeScript source and are transpiled by Next.
  transpilePackages: [
    "@khiye/shared",
    "@khiye/ui",
    "@khiye/preview",
    "@khiye/editor",
    "@khiye/content-sdk",
    "@khiye/checkers",
    "@khiye/db",
  ],
  // Heavy Node deps used only in server route handlers (the checker runner and
  // the auth/persistence path): required at runtime, never bundled by webpack.
  serverExternalPackages: ["happy-dom", "@babel/parser", "@prisma/client", "@node-rs/argon2"],
  // @khiye/db is transpiled (TS source), which drags its transitive native deps
  // into the webpack graph and defeats serverExternalPackages. Externalise the
  // argon2 native bindings and the Prisma client on the server build so the
  // .node binary is require()'d at runtime instead of bundled.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(({ request }, cb) => {
        if (request && (request.startsWith("@node-rs/argon2") || request.startsWith("@prisma/client"))) {
          return cb(null, `commonjs ${request}`);
        }
        cb();
      });
    }
    return config;
  },
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
