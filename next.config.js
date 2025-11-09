/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_BUILD_REV: process.env.APP_BUILD_REV,
  },
};

module.exports = nextConfig;
