const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Monorepo kökünü işaretleyerek outputFileTracing uyarılarını bastır
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [
      { source: '/admin-api/:path*', destination: 'http://127.0.0.1:5001/admin-api/:path*' },
      { source: '/admin-products/:path*', destination: 'http://127.0.0.1:5001/admin-products/:path*' },
      { source: '/api/drive', destination: 'http://127.0.0.1:5001/api/drive' },
      { source: '/api/:path*', destination: 'http://127.0.0.1:5001/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
