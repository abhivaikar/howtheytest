/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/howtheytest',
  assetPrefix: '/howtheytest',
  images: {
    unoptimized: true,
  },
  // Ensure static files are served correctly
  trailingSlash: true,
}

module.exports = nextConfig
