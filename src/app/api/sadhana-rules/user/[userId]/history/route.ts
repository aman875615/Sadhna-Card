import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyOverridePermission } from '@/lib/rule-override-engine';

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

    const { allowed, targetUser, error, status } = await verifyOverridePermission(
      sessionUser,
      targetUserId
    );

    if (!allowed || !targetUser) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: status || 403 });
    }

    // Fetch audit trail
    const auditLogs = await prisma.sadhanaRuleAuditLog.findMany({
      where: { targetUserId },
      include: {
        performedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch full history of overrides
    const overrides = await prisma.sadhanaRuleOverride.findMany({
      where: { targetUserId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        role: targetUser.role,
      },
      auditLogs,
      overrides,
    });
  } catch (err: any) {
    console.error('Error fetching rule history:', err);
    return NextResponse.json({ error: 'Failed to fetch rule history' }, { status: 500 });
  }
}
