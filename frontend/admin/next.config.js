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
};

module.exports = nextConfig;

