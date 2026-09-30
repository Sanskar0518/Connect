/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./prisma/seed.db'],
    },
  },
};

export default nextConfig;
