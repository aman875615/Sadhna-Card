import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'sadhana_auth_token';

// Public paths that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/register',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/hierarchy-options',
  '/manifest.json',
  '/manifest.webmanifest',
  '/sw.js',
  '/favicon.ico',
  '/favicon.png',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, images, api auth, and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
  ) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Check for authentication cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // If no auth token, redirect to login page
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;
