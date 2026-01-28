// Middleware for authentication, route protection, and i18n
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '../i18n.config';

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

// Define API routes
const apiRoutes = ['/api'];

// Define role-based route access
const roleBasedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/settings/company': ['admin', 'manager'],
  '/reports': ['admin', 'manager', 'agent'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // i18n: Check if pathname has a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // i18n: Redirect to default locale if no locale in pathname
  if (!pathnameHasLocale && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    // Get locale from cookie or use default
    const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = localeCookie && locales.includes(localeCookie as any) ? localeCookie : defaultLocale;

    // Redirect to locale-prefixed path
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const accessToken = request.cookies.get('accessToken')?.value ||
                     request.headers.get('Authorization')?.replace('Bearer ', '');

  // Redirect to login if no token
  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For API routes, validate token (simplified version)
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    try {
      // In production, verify JWT token here
      // For now, just check if token exists
      if (!accessToken) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
        { status: 401 }
      );
    }
  }

  // Role-based access control (simplified)
  // In production, decode JWT and check user role
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      // In production, verify user role from JWT token
      // For now, allow all authenticated users
      // You can decode the JWT and check roles here
    }
  }

  // Security and Performance headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Performance headers - Cache Control
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
  } else {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }

  // Compression hint
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  if (acceptEncoding.includes('br')) {
    response.headers.set('X-Compression', 'brotli');
  } else if (acceptEncoding.includes('gzip')) {
    response.headers.set('X-Compression', 'gzip');
  }

  // Preload critical resources on homepage
  if (pathname === '/') {
    response.headers.set('Link', [
      '</fonts/main.woff2>; rel=preload; as=font; crossorigin',
    ].join(', '));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
