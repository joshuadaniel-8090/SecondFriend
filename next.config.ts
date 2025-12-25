import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is the correct configuration for Next.js 14+
    // For older versions, this might be under `devServer`.
    allowedDevOrigins: [
      'https://6000-firebase-studio-1766667781313.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
