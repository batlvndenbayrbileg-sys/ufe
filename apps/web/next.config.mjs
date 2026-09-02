import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship as TypeScript source and are transpiled by Next.
  transpilePackages: ["@khiye/shared"],
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
