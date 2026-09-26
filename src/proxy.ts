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
  '/api/auth/logout',
  '/api/auth/hierarchy-options',
  '/api/auth/google/init',
  '/api/auth/google/callback',
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

function isTokenValid(token?: string): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload || !payload.exp || !payload.userId) return false;
    // Must be a valid 24-character hexadecimal MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(payload.userId)) return false;
    if (Date.now() >= payload.exp * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasValidAuth = isTokenValid(token);

  // Allow static files, images, api auth, and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
  ) {
    // If logged in with valid token, redirect away from auth pages to home
    if (hasValidAuth && (pathname === '/login' || pathname === '/signup' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // If invalid token on public pages, clear invalid cookie
    if (token && !hasValidAuth) {
      const res = NextResponse.next();
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    return NextResponse.next();
  }

  // If not authenticated, redirect to login page and clean up any bad cookie
  if (!hasValidAuth) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    const res = NextResponse.redirect(loginUrl);
    if (token) {
      res.cookies.delete(AUTH_COOKIE_NAME);
    }
    return res;
  }

  return NextResponse.next();
}

export default proxy;
