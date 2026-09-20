import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { evaluateDailyEntry, CardType } from '@/lib/scoring-engine';

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Server strictly enforces user ID and cardType from authenticated session
    const userId = sessionUser.id;
    const cardType = (sessionUser.cardType || (sessionUser.role === 'BRAHMACHARI' ? 'BRAHMACHARI_S1' : 'STUDENT_S2')) as CardType;

    const rawEntry = await prisma.sadhanaEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    const evaluated = evaluateDailyEntry(
      rawEntry || { userId, date },
      cardType,
      date
    );

    return NextResponse.json({
      user: {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
        cardType,
      },
      date,
      entry: rawEntry,
      evaluated,
    });
  } catch (err: any) {
    console.error('Error fetching my sadhana entry:', err);
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Role-specific check: Counsellors do not fill sadhana cards for others or directly
    if (sessionUser.role === 'COUNSELLOR') {
      return NextResponse.json(
        { error: 'Counsellors do not fill Sadhana cards. Counsellor is a reporting and monitoring role.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const date = body.date;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Server strictly sets userId and cardType from session (prevents cross-user submission or card spoofing)
    const userId = sessionUser.id;
    const cardType = (sessionUser.cardType || (sessionUser.role === 'BRAHMACHARI' ? 'BRAHMACHARI_S1' : 'STUDENT_S2')) as CardType;

    const rawData = {
      sleepBedTime: body.sleepBedTime || null,
      wakeUpTime: body.wakeUpTime || null,
      daySleepMinutes: body.daySleepMinutes !== undefined && body.daySleepMinutes !== null ? Number(body.daySleepMinutes) : 0,
      japaCompletionTime: body.japaCompletionTime || null,
      japaRoundsCount: body.japaRoundsCount !== undefined && body.japaRoundsCount !== null ? Number(body.japaRoundsCount) : 16,
      mangalAarti: body.mangalAarti || null,
      guruPuja: cardType === 'BRAHMACHARI_S1' ? (body.guruPuja || null) : null,
      sbClass: body.sbClass || null,
      prasadam: body.prasadam || null,
      pathanMinutes: body.pathanMinutes !== undefined ? Number(body.pathanMinutes) : 0,
      pathanBookName: body.pathanBookName || null,
      sravanMinutes: body.sravanMinutes !== undefined ? Number(body.sravanMinutes) : 0,
      sravanLectureTopic: body.sravanLectureTopic || null,
      officeOutTime: cardType === 'STUDENT_S2' ? (body.officeOutTime || null) : null,
      officeInTime: cardType === 'STUDENT_S2' ? (body.officeInTime || null) : null,
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
          userId,
          date,
        },
      },
      create: {
        userId,
        date,
        ...rawData,
      },
      update: {
        ...rawData,
      },
    });

    const evaluated = evaluateDailyEntry(updatedEntry, cardType, date);

    return NextResponse.json({
      success: true,
      message: `${sessionUser.role === 'BRAHMACHARI' ? 'Brahmachari' : 'Student'} Sadhana saved successfully`,
      cardType,
      entry: updatedEntry,
      evaluated,
    });
  } catch (err: any) {
    console.error('Error saving my sadhana entry:', err);
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
  }
}
