const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ]
  },
  async rewrites() {
    return [
      { source: "/admin-api/:path*", destination: "/api/admin-api/:path*" },
    ];
  },
  outputFileTracingRoot: path.join(__dirname),
}

module.exports = nextConfig;
