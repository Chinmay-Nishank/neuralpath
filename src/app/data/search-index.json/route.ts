import { NextResponse } from 'next/server';
import { getSearchableLessons } from '@/lib/content';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(getSearchableLessons());
}

