import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware: proxy requests to /api/bridge/* to the HANOON bot's
 * TelemetryAPI. In production (Vercel), the bot runs on a VPS and the
 * proxy route injects the correct endpoint.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  if (url.pathname.startsWith('/api/bridge/')) {
    const target = process.env.HANOON_BOT_URL || 'http://localhost:8080';
    const path = url.pathname.replace('/api/bridge/', '');
    return NextResponse.rewrite(new URL(`${target}/${path}`, target));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/bridge/:path*'],
};
