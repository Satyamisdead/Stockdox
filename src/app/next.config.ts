
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // uncomment to disable PWA in development
  // exclude: [ // Example: exclude admin routes from PWA caching
  //   ({ asset, compilation }) => asset.name.startsWith("server/") || asset.name.match(/^.+\\.map$/) || asset.name.includes('admin'),
  // ],
};

const withPWA = withPWAInit(pwaConfig);

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3-symbol-logo.tradingview.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static2.finnhub.io',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
