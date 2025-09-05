import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/tierlist",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/tierlist",
  },
  eslint: {
    // Avoid failing production builds due to lint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
