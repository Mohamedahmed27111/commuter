import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Public paths — no auth required
const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/driver/sign-in',
  '/driver/sign-up',
  '/forgot-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('commuter_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const decoded = jwtDecode<{ role: 'driver' | 'user'; exp: number }>(token);

    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/driver') && decoded.role !== 'driver') {
      return NextResponse.redirect(new URL('/user/map', request.url));
    }
    if (pathname.startsWith('/user') && decoded.role !== 'user') {
      return NextResponse.redirect(new URL('/driver/requests', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/driver/:path*', '/user/:path*'],
};
