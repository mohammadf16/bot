/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === "true"
const basePath = process.env.NEXT_BASE_PATH || ""

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: isStaticExport ? "export" : undefined,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: isStaticExport,
  images: {
    unoptimized: isStaticExport,
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
}

module.exports = nextConfig
