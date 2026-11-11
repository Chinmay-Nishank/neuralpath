import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { getPrisma } from '@/lib/prisma';

const FeedbackSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('newsletter'),
    email: z.string().email().max(254),
  }),
  z.object({
    kind: z.literal('lesson_feedback'),
    lessonSlug: z.string().min(1).max(160),
    helpful: z.boolean(),
    comment: z.string().max(1000).optional(),
  }),
]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const rate = checkRateLimit(`feedback:${ip}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  const prisma = getPrisma();
  if (prisma) {
    const data = parsed.data;
    await prisma.feedback.create({
      data:
        data.kind === 'newsletter'
          ? { kind: 'newsletter', email: data.email }
          : {
              kind: 'lesson_feedback',
              lessonSlug: data.lessonSlug,
              helpful: data.helpful,
              comment: data.comment,
            },
    });
  }

  return NextResponse.json({ ok: true });
}

