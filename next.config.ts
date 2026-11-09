import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  images: {
    // Local dev only: the optimizer downloads each image server-side with a hard 7s timeout, which
    // large PNGs from R2 exceed on a slow connection (500 error). Let the browser load them directly.
    // Production builds are unaffected.
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "br-fancy-darkness-b46tipgm.storage.c-6.us-east-2.aws.neon.tech",
      },
      {
        protocol: "https",
        hostname: "pub-8bbc8532a235419a91cbc47ea9ffc310.r2.dev",
      },
    ],
  },
};

export default nextConfig;