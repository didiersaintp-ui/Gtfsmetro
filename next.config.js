/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Fix for Leaflet on server-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle .node files for better-sqlite3
    config.externals = [...(config.externals || []), 'better-sqlite3'];

    return config;
  },
  // Increase body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

module.exports = nextConfig;
