import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getEffectiveSadhanaRulesForDate } from '@/lib/rule-override-engine';

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    const effectiveRules = await getEffectiveSadhanaRulesForDate(
      sessionUser.id,
      sessionUser.role,
      targetDate
    );

    return NextResponse.json({
      user: {
        id: sessionUser.id,
        name: sessionUser.name,
        role: sessionUser.role,
        cardType: sessionUser.cardType,
        counsellor: sessionUser.counsellor,
        preacher: sessionUser.preacher,
      },
      effectiveRules,
      date: targetDate,
    });
  } catch (err: any) {
    console.error('Error fetching my sadhana rules:', err);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}
