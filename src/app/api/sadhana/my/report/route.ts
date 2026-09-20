import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generatePeriodReport, CardType } from '@/lib/scoring-engine';

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '2026-09-01';
    const to = searchParams.get('to') || '2026-09-15';

    const userId = sessionUser.id;
    const cardType = (sessionUser.cardType || (sessionUser.role === 'BRAHMACHARI' ? 'BRAHMACHARI_S1' : 'STUDENT_S2')) as CardType;

    const entries = await prisma.sadhanaEntry.findMany({
      where: {
        userId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'asc' },
    });

    const report = generatePeriodReport(
      {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
        cardType,
        counsellorName: sessionUser.counsellor?.name,
        preacherName: sessionUser.preacher?.name,
      },
      from,
      to,
      entries
    );

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Error generating my sadhana report:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
