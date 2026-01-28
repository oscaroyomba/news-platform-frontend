import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // simple allow-list (very reliable)
    domains: ["localhost", "127.0.0.1"],

    // keep remotePatterns too
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "1337",
        pathname: "/uploads/**",
      },
    ],
  },
}