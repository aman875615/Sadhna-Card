import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import {
  verifyOverridePermission,
  getAdminRuleConfigs,
  calculateAllowedRange,
  getEffectiveSadhanaRulesForDate,
  SadhanaRuleKey,
} from '@/lib/rule-override-engine';

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

    const configs = await getAdminRuleConfigs();
    const today = new Date().toISOString().split('T')[0];
    const effectiveRules = await getEffectiveSadhanaRulesForDate(
      targetUser.id,
      targetUser.role,
      today
    );

    // Build array of overrideable rules with metadata & calculated min/max boundaries
    const availableRules = Object.values(configs).map((cfg) => {
      const isAllowedForRole =
        sessionUser.role === 'ADMIN' ||
        cfg.allowedFor.includes(sessionUser.role as any);

      const bounds = calculateAllowedRange(cfg, targetUser.role);
      const currentActive = effectiveRules.activeOverrides[cfg.key];

      return {
        key: cfg.key,
        label: cfg.label,
        category: cfg.category,
        unit: cfg.unit,
        description: cfg.description,
        isAllowed: isAllowedForRole,
        defaultVal: bounds.defaultVal,
        allowedMin: bounds.min,
        allowedMax: bounds.max,
        maxDurationDays: cfg.maxDurationDays,
        currentEffectiveValue: currentActive ? currentActive.overrideValue : bounds.defaultVal,
        activeOverride: currentActive || null,
      };
    });

    // Also fetch all overrides (active, expired, revoked) for this user
    const allOverrides = await prisma.sadhanaRuleOverride.findMany({
      where: { targetUserId: targetUser.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        cardType: targetUser.cardType,
        counsellor: targetUser.counsellor,
        preacher: targetUser.preacher,
      },
      availableRules,
      effectiveRules,
      allOverrides,
    });
  } catch (err: any) {
    console.error('Error fetching user sadhana rules:', err);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}
