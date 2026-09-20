import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sadhana-card-super-secret-key-2026';
const AUTH_COOKIE_NAME = 'sadhana_auth_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  cardType: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId || !/^[0-9a-fA-F]{24}$/.test(payload.userId)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        counsellor: { select: { id: true, name: true, email: true } },
        preacher: { select: { id: true, name: true, email: true } },
      },
    });

    return user;
  } catch (err) {
    console.error('Error fetching session user:', err);
    return null;
  }
}

export { AUTH_COOKIE_NAME };
