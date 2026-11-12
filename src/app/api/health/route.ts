import { NextResponse } from 'next/server';
import { getAllLessons } from '@/lib/content';
import { getAllCards } from '@/lib/cards';
import { isDatabaseConfigured } from '@/lib/prisma';
import { isAuthConfigured } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: 'healthy',
      lessons: getAllLessons().length,
      cards: getAllCards().length,
      databaseConfigured: isDatabaseConfigured,
      authConfigured: isAuthConfigured,
      searchEngine: 'google',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
