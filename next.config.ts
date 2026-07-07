import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    serverActions: {
      bodySizeLimit: "5mb",
    },
  }
};

export default nextConfig;
