import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@solufacil/shared',
    '@solufacil/graphql-schema',
    '@solufacil/business-logic',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/solufacil/**',
      },
    ],
  },
}

export default nextConfig
