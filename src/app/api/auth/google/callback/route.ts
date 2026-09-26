import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo, findOrCreateGoogleUser } from '@/lib/google-auth';
import { signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

function getOrigin(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const origin = getOrigin(req);
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const errorParam = url.searchParams.get('error');
    const stateParam = url.searchParams.get('state');

    if (errorParam || !code) {
      console.warn('Google OAuth returned error or no code:', errorParam);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam || 'Authentication was cancelled')}`);
    }

    let extra: { role?: string; counsellorId?: string; preacherId?: string; returnTo?: string } = {};
    if (stateParam) {
      try {
        const decoded = Buffer.from(stateParam, 'base64url').toString('utf-8');
        extra = JSON.parse(decoded);
      } catch (e) {
        console.warn('Failed to parse OAuth state parameter:', e);
      }
    }

    // Exchange code for access & id tokens
    const tokens = await exchangeCodeForTokens(code, origin);

    // Fetch user profile from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    if (!userInfo || !userInfo.email) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not retrieve email from Google')}`);
    }

    // Find or create devotee user in MongoDB
    const user = await findOrCreateGoogleUser(userInfo, {
      role: extra.role,
      counsellorId: extra.counsellorId,
      preacherId: extra.preacherId,
    });

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      cardType: user.cardType,
      name: user.name,
    });

    const destination = extra.returnTo && extra.returnTo.startsWith('/') ? extra.returnTo : '/';
    const response = NextResponse.redirect(`${origin}${destination}`);

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
  }
}
