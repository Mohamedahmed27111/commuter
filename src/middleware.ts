import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const LOCALES = ['en', 'ar'] as const;
const DEFAULT_LOCALE = 'en';

function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) return cookie;
  const accept = request.headers.get('accept-language') ?? '';
  if (accept.startsWith('ar') || accept.includes(',ar')) return 'ar';
  return DEFAULT_LOCALE;
}

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
  const locale = detectLocale(request);

  // Inject locale header so next-intl server functions (getLocale/getMessages) can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale);

  const base = NextResponse.next({ request: { headers: requestHeaders } });
  base.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return base;
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

  return base;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
