import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
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
};

export default withNextIntl(nextConfig);
