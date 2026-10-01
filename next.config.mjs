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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@napi-rs/canvas', 'pdfjs-dist'],
    outputFileTracingIncludes: {
      '/**': ['./prisma/seed.db'],
    },
  },
};

export default nextConfig;
