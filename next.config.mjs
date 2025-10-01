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
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', '@radix-ui'],
    webpackBuildWorker: true,
    optimizeCss: true,
  },
  // Required for Replit environment to allow iframe hosting
  allowedDevOrigins: ['127.0.0.1', '39d263ea-70ea-4ff8-8a18-8caf2ad0c8fe-00-1ne3sa8eiu7t1.riker.replit.dev'],
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle for performance
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Heavy chart libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|react-syntax-highlighter)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 30,
            },
            // UI components
            ui: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'ui',
              chunks: 'all', 
              priority: 20,
            },
            // Common chunks
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              priority: 5,
              enforce: true,
            },
          },
        },
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

export default nextConfig