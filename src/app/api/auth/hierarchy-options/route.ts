import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const counsellors = await prisma.user.findMany({
      where: { role: 'COUNSELLOR' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    const brahmacharis = await prisma.user.findMany({
      where: { role: 'BRAHMACHARI' },
      select: { id: true, name: true, email: true, counsellorId: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      counsellors,
      brahmacharis,
    });
  } catch (err: any) {
    console.error('Error fetching hierarchy options:', err);
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
  }
}
