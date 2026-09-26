import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import {
  verifyOverridePermission,
  getAdminRuleConfigs,
  calculateAllowedRange,
  validateRuleOverrideInput,
  SadhanaRuleKey,
} from '@/lib/rule-override-engine';

export async function POST(
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

    const body = await req.json();
    const {
      ruleKey,
      overrideValue,
      effectiveFrom,
      effectiveUntil,
      reason,
    } = body;

    if (!ruleKey || !overrideValue) {
      return NextResponse.json({ error: 'ruleKey and overrideValue are required.' }, { status: 400 });
    }

    const configs = await getAdminRuleConfigs();
    const ruleDef = configs[ruleKey as SadhanaRuleKey];

    if (!ruleDef) {
      return NextResponse.json({ error: `Unknown or unsupported rule: ${ruleKey}` }, { status: 400 });
    }

    // Check if role is permitted for this specific rule
    if (sessionUser.role !== 'ADMIN' && !ruleDef.allowedFor.includes(sessionUser.role as any)) {
      return NextResponse.json(
        { error: `Your role (${sessionUser.role}) is not authorized to override rule ${ruleDef.label}.` },
        { status: 403 }
      );
    }

    const validation = validateRuleOverrideInput(
      ruleDef,
      targetUser.role,
      overrideValue,
      effectiveFrom,
      effectiveUntil,
      reason
    );

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bounds = calculateAllowedRange(ruleDef, targetUser.role);

    // Revoke any existing active override for this user and ruleKey
    const previousActive = await prisma.sadhanaRuleOverride.findFirst({
      where: {
        targetUserId: targetUser.id,
        ruleKey,
        status: 'ACTIVE',
      },
    });

    if (previousActive) {
      await prisma.sadhanaRuleOverride.update({
        where: { id: previousActive.id },
        data: { status: 'REVOKED' },
      });
    }

    // Create new personal override
    const newOverride = await prisma.sadhanaRuleOverride.create({
      data: {
        ruleKey,
        targetUserId: targetUser.id,
        targetRole: targetUser.role,
        createdById: sessionUser.id,
        createdByRole: sessionUser.role,
        originalValue: bounds.defaultVal,
        overrideValue: overrideValue.trim(),
        allowedDeviation: `[${bounds.min} - ${bounds.max}]`,
        reason: reason.trim(),
        effectiveFrom: effectiveFrom.trim(),
        effectiveUntil: effectiveUntil ? effectiveUntil.trim() : null,
        status: 'ACTIVE',
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Create Audit Log record
    await prisma.sadhanaRuleAuditLog.create({
      data: {
        action: 'SADHANA_RULE_OVERRIDE_CREATED',
        performedById: sessionUser.id,
        targetUserId: targetUser.id,
        ruleKey,
        oldValue: previousActive ? previousActive.overrideValue : bounds.defaultVal,
        newValue: overrideValue.trim(),
        reason: reason.trim(),
        effectiveFrom: effectiveFrom.trim(),
        effectiveUntil: effectiveUntil ? effectiveUntil.trim() : null,
        metadata: JSON.stringify({
          ruleLabel: ruleDef.label,
          targetUserName: targetUser.name,
          targetUserEmail: targetUser.email,
          performedByName: sessionUser.name,
          allowedRange: `[${bounds.min} - ${bounds.max}]`,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully set custom rule for ${ruleDef.label}`,
      override: newOverride,
    });
  } catch (err: any) {
    console.error('Error creating rule override:', err);
    return NextResponse.json({ error: err.message || 'Failed to create rule override' }, { status: 500 });
  }
}
