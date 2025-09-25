import type { NextConfig } from "next";

const subapps = ["bingo","board","compass","game","hotels","house","legacytierlist","party","population","sites","startpage","stats","syid","syofficial"]
const staticDirs = ["assets","styles","components","flag-replacer", ...subapps]

const nextConfig: NextConfig = {
  basePath: "/tierlist",
  env: { NEXT_PUBLIC_BASE_PATH: "/tierlist" },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    const toIndex = [ { source: "/", destination: "/index.html" }, ...subapps.map((d) => ({ source: `/${d}`, destination: `/${d}/index.html` })) ]
    const slashes = subapps.map((d) => ({ source: `/${d}/`, destination: `/${d}/index.html` }))
    const passthru = staticDirs.map((d) => ({ source: `/${d}/:path*`, destination: `/${d}/:path*` }))
    const apiForward = [ { source: "/api/:path*", destination: "/tierlist/api/:path*" } ]
    return { beforeFiles: [ ...toIndex, ...slashes, ...passthru, ...apiForward ] }
  },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
