
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

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
      },
      {
        protocol: 'https',
        hostname: 'api.marketaux.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.seekingalpha.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

let finalConfig = nextConfig;

// Only apply PWA wrapper in production to avoid conflicts with Turbopack in development
if (process.env.NODE_ENV === 'production') {
  const withPWA = withPWAInit({
    dest: 'public',
    register: true,
    skipWaiting: true,
    fallbacks: {
      document: '/offline',
    }
  });
  finalConfig = withPWA(nextConfig);
}

export default finalConfig;
