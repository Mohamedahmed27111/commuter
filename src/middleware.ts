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

  // Read role from the dedicated cookie first (reliable); fall back to JWT claim
  let role: 'driver' | 'user' | undefined =
    (request.cookies.get('commuter_role')?.value as 'driver' | 'user' | undefined);

  try {
    const decoded = jwtDecode<{ role?: 'driver' | 'user'; exp?: number }>(token);
    // Only use exp from JWT if present
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Use JWT role if the cookie role isn't set
    if (!role && decoded.role) role = decoded.role;
  } catch {
    // Token is not a decodable JWT — rely solely on the role cookie
    if (!role) return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/driver') && role !== 'driver') {
    return NextResponse.redirect(new URL('/user/request', request.url));
  }
  if (pathname.startsWith('/user') && role !== 'user') {
    return NextResponse.redirect(new URL('/driver/requests', request.url));
  }

  return base;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
