import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          path: false,
          os: false,
          'pino-pretty': false,
          'pino': false
        }
      };
    }
    return config;
  },
  transpilePackages: ['pino-pretty', 'pino'],
  experimental: {
    serverComponentsExternalPackages: ['pino-pretty', 'pino']
  }
};

export default nextConfig;
