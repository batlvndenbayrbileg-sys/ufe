import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
