const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  // Monorepo kökünü işaretleyerek outputFileTracing uyarılarını bastır
  outputFileTracingRoot: path.join(__dirname, ".."),
};

module.exports = nextConfig;
