import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sales/ui", "@sales/types"],
};

export default nextConfig;
