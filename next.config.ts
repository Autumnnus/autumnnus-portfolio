import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: (process.env.MINIO_USE_SSL === "true" ? "https" : "http") as
          | "http"
          | "https",
        hostname: process.env.MINIO_ENDPOINT || "localhost",
        port: process.env.MINIO_PORT || "9000",
        pathname: `/${process.env.MINIO_BUCKET_NAME || "autumnnus-assets"}/**`,
      },
      {
        protocol: (process.env.MINIO_USE_SSL === "true" ? "https" : "http") as
          | "http"
          | "https",
        hostname: "127.0.0.1",
        port: process.env.MINIO_PORT || "9000",
        pathname: `/${process.env.MINIO_BUCKET_NAME || "autumnnus-assets"}/**`,
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: 10 * 1024 * 1024,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
