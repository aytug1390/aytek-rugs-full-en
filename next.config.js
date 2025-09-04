/** @type {import('next').NextConfig} */
const nextConfig = {
	outputFileTracingRoot: __dirname,
	// We now proxy admin-api through a Next API route (app/api/admin-api/...) so
	// the server can handle backend downtime gracefully.
};

module.exports = nextConfig;
