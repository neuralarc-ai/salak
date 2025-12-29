/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure proper static asset serving
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Disable X-Powered-By header for security
  poweredByHeader: false,
  // Ensure proper static optimization
  experimental: {
    // Enable modern features for better static asset handling
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Configure headers for static assets
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

