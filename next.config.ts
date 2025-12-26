import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [],
  },
  // Enable experimental features if needed
  experimental: {
    // serverActions: {
    //   allowedOrigins: ["localhost:3000"],
    // },
  },
};

export default nextConfig;
