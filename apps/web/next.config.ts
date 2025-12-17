import type { NextConfig } from 'next'

// Get Cloudinary cloud name from environment variable
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

if (!cloudinaryCloudName) {
  throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable is required')
}

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
        pathname: `/${cloudinaryCloudName}/**`,
      },
    ],
  },
}

export default nextConfig
