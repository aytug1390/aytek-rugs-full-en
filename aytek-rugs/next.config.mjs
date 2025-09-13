import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Prevent Next from warning about inferred workspace root when multiple lockfiles exist.
	// Point to repository root so output tracing and file tracing behave correctly.
	outputFileTracingRoot: path.join(process.cwd(), '..'),

	// During CI/build we don't want lint to fail the build; mirror admin-app behavior.
	eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
