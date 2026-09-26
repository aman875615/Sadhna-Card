import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { getAdminRuleConfigs, DEFAULT_RULE_DEFINITIONS, SadhanaRuleKey } from '@/lib/rule-override-engine';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const configs = await getAdminRuleConfigs();
    return NextResponse.json({ configs });
  } catch (err: any) {
    console.error('Error fetching admin rule configs:', err);
    return NextResponse.json({ error: 'Failed to fetch rule configs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { key, updates } = body;

    if (!key || !updates) {
      return NextResponse.json({ error: 'key and updates are required.' }, { status: 400 });
    }

    const currentConfigs = await getAdminRuleConfigs();
    if (!currentConfigs[key as SadhanaRuleKey]) {
      return NextResponse.json({ error: `Invalid rule key: ${key}` }, { status: 400 });
    }

    currentConfigs[key as SadhanaRuleKey] = {
      ...currentConfigs[key as SadhanaRuleKey],
      ...updates,
    };

    await prisma.ruleConfig.upsert({
      where: { key: 'OVERRIDE_RULES_SETTINGS' },
      create: {
        key: 'OVERRIDE_RULES_SETTINGS',
        value: JSON.stringify(currentConfigs),
      },
      update: {
        value: JSON.stringify(currentConfigs),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated configuration for rule ${key}`,
      configs: currentConfigs,
    });
  } catch (err: any) {
    console.error('Error saving admin rule configs:', err);
    return NextResponse.json({ error: 'Failed to save rule configs' }, { status: 500 });
  }
}
