import { prisma } from './prisma';
import { hashPassword } from './auth';

function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ''
  ).trim();
}

function getGoogleClientSecret(): string {
  return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
}

export interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

export function getGoogleAuthUrl(origin: string, state?: string): string {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in Environment Variables');
  }
  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  if (state) {
    params.set('state', state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, origin: string) {
  const redirectUri = `${origin}/api/auth/google/callback`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google token exchange error:', errorData);
    throw new Error('Failed to exchange authorization code with Google');
  }

  const data = await response.json();
  return data as { access_token: string; id_token: string; expires_in: number };
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google userinfo error:', errorData);
    throw new Error('Failed to fetch user profile from Google');
  }

  const data = await response.json();
  return data as GoogleUserInfo;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) {
    throw new Error('Invalid Google ID Token');
  }

  const payload = await response.json();
  if (payload.aud !== getGoogleClientId()) {
    throw new Error('Google Token Audience mismatch');
  }

  return {
    sub: payload.sub,
    name: payload.name || payload.email.split('@')[0],
    email: payload.email,
    picture: payload.picture,
    email_verified: payload.email_verified === 'true' || payload.email_verified === true,
  };
}

export async function findOrCreateGoogleUser(
  userInfo: GoogleUserInfo,
  extra?: { role?: string; counsellorId?: string; preacherId?: string }
) {
  const cleanEmail = userInfo.email.toLowerCase().trim();

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (user) {
    // Update avatar if not present
    if (!user.avatarUrl && userInfo.picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: userInfo.picture },
      });
    }
    return user;
  }

  // Create new user
  const randomPassword = `google_oauth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const passwordHash = await hashPassword(randomPassword);

  const selectedRole = extra?.role || 'STUDENT';
  let cardType = 'STUDENT_S2';
  if (selectedRole === 'BRAHMACHARI' || selectedRole === 'COUNSELLOR' || selectedRole === 'ADMIN') {
    cardType = 'BRAHMACHARI_S1';
  }

  const newUser = await prisma.user.create({
    data: {
      name: userInfo.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      passwordHash,
      avatarUrl: userInfo.picture || null,
      role: selectedRole,
      cardType,
      counsellorId: extra?.counsellorId || null,
      preacherId: extra?.preacherId || null,
    },
  });

  return newUser;
}
