import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http" as const,
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
