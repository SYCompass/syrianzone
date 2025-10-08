/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_BASE_PATH ?? ""

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
