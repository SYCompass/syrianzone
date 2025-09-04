import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/tierlist",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/tierlist",
  },
};

export default nextConfig;
