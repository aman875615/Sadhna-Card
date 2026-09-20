import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role === 'ADMIN') {
      // Admin gets full tree of all counsellors, brahmacharis, and students
      const counsellors = await prisma.user.findMany({
        where: { role: 'COUNSELLOR' },
        include: {
          brahmacharis: {
            include: {
              students: true,
            },
          },
        },
      });

      // Also get standalone brahmacharis or students if any
      const unassignedBrahmacharis = await prisma.user.findMany({
        where: { role: 'BRAHMACHARI', counsellorId: null },
        include: { students: true },
      });

      return NextResponse.json({
        tree: counsellors,
        unassigned: unassignedBrahmacharis,
        currentUser: sessionUser,
      });
    }

    if (sessionUser.role === 'COUNSELLOR') {
      // Counsellor gets their brahmacharis and their students
      const counsellor = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          brahmacharis: {
            include: {
              students: true,
            },
          },
        },
      });

      return NextResponse.json({
        tree: counsellor ? [counsellor] : [],
        currentUser: sessionUser,
      });
    }

    if (sessionUser.role === 'BRAHMACHARI') {
      // Brahmachari gets their own profile + students
      const brahmachari = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          students: true,
          counsellor: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({
        brahmachari,
        students: brahmachari?.students || [],
        currentUser: sessionUser,
      });
    }

    // Student
    const student = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        preacher: { select: { id: true, name: true, email: true } },
        counsellor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      student,
      currentUser: sessionUser,
    });
  } catch (err: any) {
    console.error('Error fetching hierarchy tree:', err);
    return NextResponse.json({ error: 'Failed to fetch tree' }, { status: 500 });
  }
}
