import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generatePeriodReport, CardType } from '@/lib/scoring-engine';
import { getEffectiveSadhanaRulesForRange } from '@/lib/rule-override-engine';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '2026-09-01';
    const to = searchParams.get('to') || '2026-09-15';

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        counsellor: { select: { id: true, name: true } },
        preacher: { select: { id: true, name: true } },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Role-based Access Control (RBAC)
    const isSelf = sessionUser.id === targetUser.id;
    const isAdmin = sessionUser.role === 'ADMIN';
    const isCounsellorOfUser =
      sessionUser.role === 'COUNSELLOR' &&
      (targetUser.counsellorId === sessionUser.id || targetUser.id === sessionUser.id);
    const isPreacherOfUser =
      sessionUser.role === 'BRAHMACHARI' &&
      (targetUser.preacherId === sessionUser.id || targetUser.id === sessionUser.id);

    let isCounsellorOfPreacher = false;
    if (sessionUser.role === 'COUNSELLOR' && targetUser.preacherId) {
      const preacher = await prisma.user.findUnique({ where: { id: targetUser.preacherId } });
      if (preacher && preacher.counsellorId === sessionUser.id) {
        isCounsellorOfPreacher = true;
      }
    }

    if (!isSelf && !isAdmin && !isCounsellorOfUser && !isPreacherOfUser && !isCounsellorOfPreacher) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to view this report' }, { status: 403 });
    }

    // Query raw Sadhana records in the [from, to] interval
    const entries = await prisma.sadhanaEntry.findMany({
      where: {
        userId: targetUserId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Resolve date-specific effective rules across the requested date range
    const rulesByDateMap = await getEffectiveSadhanaRulesForRange(
      targetUserId,
      targetUser.role,
      from,
      to
    );

    const report = generatePeriodReport(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        cardType: targetUser.cardType as CardType,
        counsellorName: targetUser.counsellor?.name,
        preacherName: targetUser.preacher?.name,
      },
      from,
      to,
      entries,
      rulesByDateMap
    );

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Error generating report:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
