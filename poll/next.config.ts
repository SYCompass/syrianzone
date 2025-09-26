import type { NextConfig } from "next";

const subapps = ["bingo","board","compass","game","hotels","house","legacytierlist","party","population","sites","startpage","stats","syid","syofficial"]
const staticDirs = ["assets","styles","components","flag-replacer", ...subapps]

const isProd = process.env.NODE_ENV === "production"
const BASE_PATH = isProd ? "/tierlist" : ""

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  assetPrefix: BASE_PATH,
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    const toIndex = subapps.map((d) => ({ source: `/${d}`, destination: `/${d}/index.html` }))
    const slashes = subapps.map((d) => ({ source: `/${d}/`, destination: `/${d}/index.html` }))
    const passthru = staticDirs.map((d) => ({ source: `/${d}/:path*`, destination: `/${d}/:path*` }))
    const tierlistRoutes = [
      { source: "/", destination: "/index.html" },
      { source: "/tierlist/_next/:path*", destination: "/_next/:path*" },
      { source: "/tierlist/api/:path*", destination: "/api/:path*" },
      { source: "/tierlist/images/:path*", destination: "/images/:path*" },
      { source: "/tierlist/leaderboard", destination: "/leaderboard" },
      { source: "/tierlist/leaderboard/", destination: "/leaderboard" },
      { source: "/tierlist/jolani", destination: "/jolani" },
      { source: "/tierlist/jolani/", destination: "/jolani" },
    ]
    return { beforeFiles: [ ...tierlistRoutes, ...toIndex, ...slashes, ...passthru ] }
  },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
