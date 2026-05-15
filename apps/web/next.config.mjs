// https://nextjs.org/docs/app/api-reference/config/next-config-js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@le-poulet/shared", "@le-poulet/ui"],
  images: {
    domains: ["openstreetmap.org"],
  },
  experimental: {
    optimizePackageImports: ["gsap", "framer-motion"],
  },
};

export default nextConfig;
