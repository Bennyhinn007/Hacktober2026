import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'cloudinary', 'bcryptjs'],
};

export default nextConfig;
