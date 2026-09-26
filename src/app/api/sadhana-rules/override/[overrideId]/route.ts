import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyOverridePermission } from '@/lib/rule-override-engine';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ overrideId: string }> }
) {
  try {
    const { overrideId } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const override = await prisma.sadhanaRuleOverride.findUnique({
      where: { id: overrideId },
      include: {
        targetUser: true,
      },
    });

    if (!override) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 });
    }

    // Verify permission to manage target user
    const { allowed, error, status } = await verifyOverridePermission(
      sessionUser,
      override.targetUserId
    );

    if (!allowed) {
      return NextResponse.json({ error: error || 'Forbidden' }, { status: status || 403 });
    }

    // Mark as revoked (do not delete to preserve history!)
    const updated = await prisma.sadhanaRuleOverride.update({
      where: { id: overrideId },
      data: { status: 'REVOKED' },
    });

    // Create Audit Log record
    await prisma.sadhanaRuleAuditLog.create({
      data: {
        action: 'SADHANA_RULE_OVERRIDE_REVOKED',
        performedById: sessionUser.id,
        targetUserId: override.targetUserId,
        ruleKey: override.ruleKey,
        oldValue: override.overrideValue,
        newValue: override.originalValue,
        reason: 'Revoked by authority (reverted to default)',
        effectiveFrom: override.effectiveFrom,
        effectiveUntil: override.effectiveUntil,
        metadata: JSON.stringify({
          overrideId: override.id,
          performedByName: sessionUser.name,
          targetUserName: override.targetUser.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rule override revoked. Reverted back to default rule.',
      override: updated,
    });
  } catch (err: any) {
    console.error('Error revoking rule override:', err);
    return NextResponse.json({ error: 'Failed to revoke rule override' }, { status: 500 });
  }
}
