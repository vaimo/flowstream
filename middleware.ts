import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Only protect API routes (except GET requests)
  if (pathname.startsWith('/api/') && request.method !== 'GET') {
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.API_KEY;

    if (!expectedApiKey) {
      console.warn('API_KEY environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing X-API-Key header' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};