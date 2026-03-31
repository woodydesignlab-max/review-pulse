import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Apple App Store icon CDN (모든 mzstatic.com 서브도메인)
      { protocol: "https", hostname: "**.mzstatic.com" },
      // Google Play icon CDN
      { protocol: "https", hostname: "play-lh.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
