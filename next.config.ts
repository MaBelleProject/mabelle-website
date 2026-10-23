import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  images: {
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
