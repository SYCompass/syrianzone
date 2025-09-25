import type { NextConfig } from "next";

const subapps = ["bingo","board","compass","game","hotels","house","legacytierlist","party","population","sites","startpage","stats","syid","syofficial"]
const staticDirs = ["assets","styles","components","flag-replacer", ...subapps]

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: "" },
  assetPrefix: "/tierlist",
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    const toIndex = subapps.map((d) => ({ source: `/${d}`, destination: `/${d}/index.html` }))
    const slashes = subapps.map((d) => ({ source: `/${d}/`, destination: `/${d}/index.html` }))
    const passthru = staticDirs.map((d) => ({ source: `/${d}/:path*`, destination: `/${d}/:path*` }))
    const tierlistRoutes = [
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
