import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role, counsellorId, preacherId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Determine cardType from role
    let cardType = 'STUDENT_S2';
    if (role === 'BRAHMACHARI' || role === 'COUNSELLOR' || role === 'ADMIN') {
      cardType = 'BRAHMACHARI_S1';
    }

    // Create user in MongoDB
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
        role,
        cardType,
        counsellorId: counsellorId || null,
        preacherId: preacherId || null,
      },
    });

    // Auto log in new user with JWT token cookie
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      cardType: newUser.cardType,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        cardType: newUser.cardType,
      },
    });

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
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
