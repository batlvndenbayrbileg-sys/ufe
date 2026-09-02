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
  ],
  // Heavy Node deps used only in server route handlers (the checker runner):
  // required at runtime, not bundled by webpack.
  serverExternalPackages: ["happy-dom", "@babel/parser"],
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
