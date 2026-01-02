import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler: true, // Disabled for faster builds - enable only if you need automatic React optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
