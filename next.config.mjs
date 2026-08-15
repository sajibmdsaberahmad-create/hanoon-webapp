/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The webapp proxies to the HANOON 3.0 bot's TelemetryAPI (port 8080)
  // via the /api/bridge route. This avoids CORS issues in production.
  async rewrites() {
    return [
      {
        source: '/api/bridge/:path*',
        destination: `${process.env.HANOON_BOT_URL || 'http://localhost:8080'}/:path*`,
      },
    ];
  },
  // Vercel deployment config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
  },
};

export default nextConfig;
