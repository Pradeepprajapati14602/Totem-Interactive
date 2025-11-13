import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    domains: [],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;
