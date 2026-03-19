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
    "nodemailer",
  ],
};

export default nextConfig;
