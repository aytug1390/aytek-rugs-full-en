/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname, '..'),
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' },
      // { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
