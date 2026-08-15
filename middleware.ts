import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware: pass /api/bridge/* through to the API route handler.
 *
 * IMPORTANT: we must NOT rewrite /api/bridge/* to the bot URL here.
 * The route handler (app/api/bridge/[...path]/route.ts) does the
 * actual proxying via fetch(), which lets it inject BOTH the ngrok
 * free-tier skip header AND the X-HANOON-Token auth header. A raw
 * rewrite would hit ngrok without those headers and Vercel would
 * show the ngrok interstitial page instead of live telemetry.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/bridge/:path*'],
};
