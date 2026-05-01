import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@le-poulet/shared", "@le-poulet/ui"],
  images: {
    domains: ["openstreetmap.org"],
  },
  experimental: {
    optimizePackageImports: ["gsap", "framer-motion"],
  },
};

export default nextConfig;
