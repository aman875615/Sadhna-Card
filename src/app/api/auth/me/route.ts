import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Also fetch all available users for quick switch demo
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cardType: true,
        counsellorId: true,
        preacherId: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      user: {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
        cardType: sessionUser.cardType,
        counsellor: sessionUser.counsellor,
        preacher: sessionUser.preacher,
      },
      allUsers,
    });
  } catch (err: any) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
