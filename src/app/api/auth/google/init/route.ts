import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-auth';

function getOrigin(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const counsellorId = url.searchParams.get('counsellorId');
    const preacherId = url.searchParams.get('preacherId');
    const returnTo = url.searchParams.get('returnTo') || '/';

    const stateObj = {
      role: role || undefined,
      counsellorId: counsellorId || undefined,
      preacherId: preacherId || undefined,
      returnTo,
    };

    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
    const origin = getOrigin(req);
    const googleUrl = getGoogleAuthUrl(origin, stateStr);
    return NextResponse.redirect(googleUrl);
  } catch (err: any) {
    console.error('Google init error:', err);
    const origin = getOrigin(req);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        err.message || 'Failed to initiate Google sign in. Please check environment configuration.'
      )}`
    );
  }
}
