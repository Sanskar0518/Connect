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
    serverComponentsExternalPackages: ['pdf-parse', '@napi-rs/canvas', 'pdfjs-dist'],
    outputFileTracingIncludes: {
      '/**': ['./prisma/seed.db'],
    },
  },
};

export default nextConfig;
