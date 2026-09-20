import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { evaluateDailyEntry, CardType } from '@/lib/scoring-engine';

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const targetUserId = searchParams.get('userId') || sessionUser.id;

    // Check permissions
    if (targetUserId !== sessionUser.id && sessionUser.role !== 'ADMIN') {
      const target = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const isCounsellor = sessionUser.role === 'COUNSELLOR' && (target.counsellorId === sessionUser.id || target.id === sessionUser.id);
      const isPreacher = sessionUser.role === 'BRAHMACHARI' && (target.preacherId === sessionUser.id || target.id === sessionUser.id);

      if (!isCounsellor && !isPreacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, cardType: true, role: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rawEntry = await prisma.sadhanaEntry.findUnique({
      where: {
        userId_date: {
          userId: targetUserId,
          date,
        },
      },
    });

    const evaluated = evaluateDailyEntry(
      rawEntry || { userId: targetUserId, date },
      user.cardType as CardType,
      date
    );

    return NextResponse.json({
      user,
      date,
      entry: rawEntry,
      evaluated,
    });
  } catch (err: any) {
    console.error('Error fetching sadhana entry:', err);
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const targetUserId = body.userId || sessionUser.id;
    const date = body.date;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Permission check
    if (targetUserId !== sessionUser.id && sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot modify other user data' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const rawData = {
      sleepBedTime: body.sleepBedTime || null,
      wakeUpTime: body.wakeUpTime || null,
      daySleepMinutes: body.daySleepMinutes !== undefined && body.daySleepMinutes !== null ? Number(body.daySleepMinutes) : 0,
      japaCompletionTime: body.japaCompletionTime || null,
      japaRoundsCount: body.japaRoundsCount !== undefined && body.japaRoundsCount !== null ? Number(body.japaRoundsCount) : 16,
      mangalAarti: body.mangalAarti || null,
      guruPuja: body.guruPuja || null,
      sbClass: body.sbClass || null,
      prasadam: body.prasadam || null,
      pathanMinutes: body.pathanMinutes !== undefined ? Number(body.pathanMinutes) : 0,
      pathanBookName: body.pathanBookName || null,
      sravanMinutes: body.sravanMinutes !== undefined ? Number(body.sravanMinutes) : 0,
      sravanLectureTopic: body.sravanLectureTopic || null,
      officeOutTime: body.officeOutTime || null,
      officeInTime: body.officeInTime || null,
      sevaPreaching: body.sevaPreaching !== undefined ? Number(body.sevaPreaching) : 0,
      sevaManagement: body.sevaManagement !== undefined ? Number(body.sevaManagement) : 0,
      sevaLecturePrep: body.sevaLecturePrep !== undefined ? Number(body.sevaLecturePrep) : 0,
      sevaMenial: body.sevaMenial !== undefined ? Number(body.sevaMenial) : 0,
      sevaHarinamBook: body.sevaHarinamBook !== undefined ? Number(body.sevaHarinamBook) : 0,
      sevaAdhocTravel: body.sevaAdhocTravel !== undefined ? Number(body.sevaAdhocTravel) : 0,
      sevaMisc: body.sevaMisc !== undefined ? Number(body.sevaMisc) : 0,
      sevaNotes: body.sevaNotes || null,
      bhavanaNegativeTags: body.bhavanaNegativeTags
        ? typeof body.bhavanaNegativeTags === 'string'
          ? body.bhavanaNegativeTags
          : JSON.stringify(body.bhavanaNegativeTags)
        : null,
      bhavanaPositiveTags: body.bhavanaPositiveTags
        ? typeof body.bhavanaPositiveTags === 'string'
          ? body.bhavanaPositiveTags
          : JSON.stringify(body.bhavanaPositiveTags)
        : null,
      personalNotes: body.personalNotes || null,
    };

    const updatedEntry = await prisma.sadhanaEntry.upsert({
      where: {
        userId_date: {
          userId: targetUserId,
          date,
        },
      },
      create: {
        userId: targetUserId,
        date,
        ...rawData,
      },
      update: {
        ...rawData,
      },
    });

    const evaluated = evaluateDailyEntry(updatedEntry, user.cardType as CardType, date);

    return NextResponse.json({
      success: true,
      message: 'Sadhana entry saved successfully',
      entry: updatedEntry,
      evaluated,
    });
  } catch (err: any) {
    console.error('Error saving sadhana entry:', err);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}
