import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "pg",
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcryptjs",
    "@react-pdf/renderer",
    "qrcode",
  ],
};

export default nextConfig;
