import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fernleaf/shared'],
  webpack(config) {
    // Shared ESM source uses .js specifiers, with .ts files on disk.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = { ...config.resolve.extensionAlias, '.js': ['.ts', '.tsx', '.js'] };
    return config;
  },
  async rewrites() {
    const target = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
    return [{ source: '/api/:path*', destination: `${target.replace(/\/$/, '')}/api/:path*` }];
  },
};

export default nextConfig;
