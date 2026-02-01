import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.zelty.fr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
