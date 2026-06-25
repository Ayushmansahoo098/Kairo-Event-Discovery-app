import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["firebase-admin", "playwright", "playwright-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.hackerearth.com",
      },
      {
        protocol: "https",
        hostname: "d8it4huxumps7.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "**.devfolio.co",
      },
      {
        protocol: "https",
        hostname: "devfolio.co",
      },
      {
        protocol: "https",
        hostname: "img.evbuc.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || 
                    process.env.RECOMMENDATION_API_URL || 
                    "http://localhost:8000";
    return [
      {
        source: "/api/recommendation-proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
