const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/admin-api/:path*", destination: "/api/admin-api/:path*" },
    ];
  },
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
