import { NextResponse } from 'next/server';
import { getAllLessons } from '@/lib/content';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: 'healthy',
      lessons: getAllLessons().length,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

