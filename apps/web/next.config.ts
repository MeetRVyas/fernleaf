import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fernleaf/shared'],
  async rewrites() {
    const target = process.env.API_INTERNAL_URL;
    if (!target) throw new Error('API_INTERNAL_URL is required for the /api rewrite');
    return [{ source: '/api/:path*', destination: `${target.replace(/\/$/, '')}/api/:path*` }];
  },
};

export default nextConfig;
