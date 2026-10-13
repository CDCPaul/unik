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
  async redirects() {
    const toPastTours = (source) => ({ source, destination: '/past-tours', permanent: true });
    return [
      toPastTours('/cbm'),
      toPastTours('/cbm/:path*'),
      toPastTours('/cherry-blossom-marathon'),
      toPastTours('/tour/courtside'),
      toPastTours('/tour/courtside/:path*'),
      toPastTours('/tour/cherry-blossom'),
      toPastTours('/players'),
      toPastTours('/players/:path*'),
      toPastTours('/gallery'),
      toPastTours('/info'),
      toPastTours('/cdc-travel/:path*'),
      { source: '/register', destination: '/apply', permanent: true },
    ];
  },
};

module.exports = nextConfig;

