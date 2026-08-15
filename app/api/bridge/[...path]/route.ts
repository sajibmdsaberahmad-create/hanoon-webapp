import { NextRequest, NextResponse } from 'next/server';

/**
 * API route: proxy /api/bridge/* → HANOON bot TelemetryAPI.
 * In dev: forwards to http://localhost:8080
 * In prod (Vercel): forwards to the bot's public endpoint via
 *   the HANOON_BOT_URL environment variable.
 */

const BOT_URL = process.env.HANOON_BOT_URL || 'http://localhost:8080';
const BRIDGE_TOKEN = process.env.HANOON_BRIDGE_TOKEN || '';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/bridge/', '');
  const url = `${BOT_URL}/${path}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // ngrok free tier serves an interstitial HTML page to requests
        // without this header — the Vercel server must pass it.
        'ngrok-skip-browser-warning': '1',
        ...(BRIDGE_TOKEN ? { 'X-HANOON-Token': BRIDGE_TOKEN } : {}),
      },
      next: { revalidate: 0 },
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Proxy error' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/bridge/', '');
  const url = `${BOT_URL}/${path}`;
  const body = await request.text();

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1',
        ...(BRIDGE_TOKEN ? { 'X-HANOON-Token': BRIDGE_TOKEN } : {}),
      },
      body,
      next: { revalidate: 0 },
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Proxy error' },
      { status: 502 },
    );
  }
}
