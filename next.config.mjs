/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable static output compression for uploaded files
  compress: false,
  // Allow writing to the public directory during runtime
  experimental: {
    outputFileTracing: true,
    serverComponentsExternalPackages: ['fs', 'path'],
  },
  // Ensure output standalone mode for file system access
  output: 'standalone',
}

export default nextConfig
