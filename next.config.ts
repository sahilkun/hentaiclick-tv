import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "c6149z6464.r-cdn.com",
      },
      {
        protocol: "https",
        hostname: "c6149z6465.r-cdn.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
