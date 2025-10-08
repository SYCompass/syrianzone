import type { NextConfig } from "next";

const subapps = ["bingo","board","compass","game","hotels","house","legacytierlist","party","population","sites","startpage","stats","syid","syofficial","alignment","syrian-contributors"]
const staticDirs = ["assets","styles","components","flag-replacer", ...subapps]

const isProd = process.env.NODE_ENV === "production"
const BASE_PATH = isProd ? "/tierlist" : ""

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  assetPrefix: BASE_PATH,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
  async rewrites() {
    const toIndex = subapps.map((d) => ({ source: `/${d}`, destination: `/${d}/index.html` }))
    const slashes = subapps.map((d) => ({ source: `/${d}/`, destination: `/${d}/index.html` }))
    const passthru = staticDirs.map((d) => ({ source: `/${d}/:path*`, destination: `/${d}/:path*` }))
    const tierlistRoutes = [
      { source: "/", destination: "/index.html" },
      { source: "/tierlist/_next/:path*", destination: "/_next/:path*" },
      { source: "/tierlist/api/:path*", destination: "/api/:path*" },
      { source: "/tierlist/assets/:path*", destination: "/assets/:path*" },
      { source: "/tierlist/flag-replacer/:path*", destination: "/flag-replacer/:path*" },
      { source: "/tierlist/images/:path*", destination: "/images/:path*" },
      { source: "/tierlist/leaderboard", destination: "/leaderboard" },
      { source: "/tierlist/leaderboard/", destination: "/leaderboard" },
      { source: "/tierlist/jolani", destination: "/jolani" },
      { source: "/tierlist/jolani/", destination: "/jolani" },
    ]
    const syrianContributorsRoutes = [
      { source: "/syrian-contributors/assets/:path*", destination: "/assets/:path*" },
      { source: "/syrian-contributors/styles/:path*", destination: "/styles/:path*" },
      { source: "/syrian-contributors/components/:path*", destination: "/components/:path*" },
      { source: "/syrian-contributors/flag-replacer/:path*", destination: "/flag-replacer/:path*" },
    ]
    return { beforeFiles: [ ...tierlistRoutes, ...syrianContributorsRoutes, ...toIndex, ...slashes, ...passthru ] }
  },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
