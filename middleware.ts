import { NextResponse } from '@vercel/edge';
import type { NextRequest } from '@vercel/edge';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Extract subdomain
  const parts = hostname.split('.');
  let subdomain: string | null = null;

  // Handle different hostname patterns
  if (hostname.includes('localhost')) {
    // Local: drsmith.localhost:5174
    subdomain = parts.length > 1 ? parts[0] : null;
  } else if (parts.length >= 3) {
    // Production: drsmith.recipegenerator.app
    subdomain = parts[0] === 'www' ? null : parts[0];
  }

  // Skip for main app or no subdomain
  if (!subdomain || subdomain === 'app' || subdomain === 'www') {
    return NextResponse.next();
  }

  // Add tenant context to headers for API routes and client
  const response = NextResponse.next();
  response.headers.set('x-tenant-subdomain', subdomain);

  // Also set as cookie for client-side access
  response.cookies.set('tenant-subdomain', subdomain, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
