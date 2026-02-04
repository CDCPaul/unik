/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'unik-90206.firebasestorage.app',
      },
    ],
  },
  transpilePackages: ['@unik/shared'],
  // Compiler optimizations for better compatibility
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Output optimizations for legacy browsers
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

module.exports = nextConfig;

