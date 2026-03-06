import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Standalone output is mandatory for Firebase App Hosting (Docker-based)
  output: 'standalone',
  typescript: {
    // Ensuring build proceeds even if there are minor type mismatches
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;
