/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: /api/bridge/* is proxied by the API route handler
  // (app/api/bridge/[...path]/route.ts), NOT by a framework rewrite.
  // A rewrite here would hit the bot/ngrok without the X-HANOON-Token
  // auth header or the ngrok-skip-browser-warning header, breaking the
  // live dashboard. Keep this list empty for /api/bridge.
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
