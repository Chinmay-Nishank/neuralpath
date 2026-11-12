import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

const ProgressActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('complete'),
    lessonSlug: z.string().min(1).max(160),
    quizScore: z.number().int().min(0).max(50).optional(),
    totalQuestions: z.number().int().min(0).max(50).optional(),
  }),
  z.object({
    type: z.literal('bookmark'),
    lessonSlug: z.string().min(1).max(160),
  }),
  z.object({
    type: z.literal('note'),
    lessonSlug: z.string().min(1).max(160),
    content: z.string().max(10000),
  }),
]);

export async function GET() {
  const prisma = getPrisma();
  const session = await auth();

  if (!prisma || !session?.user?.email) {
    return NextResponse.json({ synced: false, mode: 'local' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { progress: true, bookmarks: true, notes: true },
    });

    return NextResponse.json({
      synced: true,
      mode: 'database',
      user,
    });
  } catch {
    return NextResponse.json({ synced: false, mode: 'local' });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = ProgressActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid progress payload' }, { status: 400 });
  }

  const prisma = getPrisma();
  const session = await auth();
  if (!prisma || !session?.user?.email) {
    return NextResponse.json({ synced: false, mode: 'local' });
  }

  try {
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
      },
    });

    const payload = parsed.data;
    if (payload.type === 'complete') {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonSlug: { userId: user.id, lessonSlug: payload.lessonSlug } },
        update: {},
        create: { userId: user.id, lessonSlug: payload.lessonSlug },
      });
      if (typeof payload.quizScore === 'number' && typeof payload.totalQuestions === 'number') {
        await prisma.quizAttempt.create({
          data: {
            userId: user.id,
            lessonSlug: payload.lessonSlug,
            score: payload.quizScore,
            total: payload.totalQuestions,
          },
        });
      }
    } else if (payload.type === 'bookmark') {
      const existing = await prisma.bookmark.findUnique({
        where: { userId_lessonSlug: { userId: user.id, lessonSlug: payload.lessonSlug } },
      });
      if (existing) {
        await prisma.bookmark.delete({ where: { id: existing.id } });
      } else {
        await prisma.bookmark.create({
          data: { userId: user.id, lessonSlug: payload.lessonSlug },
        });
      }
    } else if (payload.type === 'note') {
      await prisma.lessonNote.upsert({
        where: { userId_lessonSlug: { userId: user.id, lessonSlug: payload.lessonSlug } },
        update: { content: payload.content },
        create: { userId: user.id, lessonSlug: payload.lessonSlug, content: payload.content },
      });
    }

    return NextResponse.json({ synced: true, mode: 'database' });
  } catch {
    return NextResponse.json({ synced: false, mode: 'local' });
  }
}

