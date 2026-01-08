import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip TypeScript and ESLint errors during build (MVP/hackathon mode)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
