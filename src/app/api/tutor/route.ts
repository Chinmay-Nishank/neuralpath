import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildTutorSystemPrompt } from '@/lib/tutor-prompt';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

const TutorRequestSchema = z.object({
  lessonRouteId: z.string().min(1).max(160),
  lessonTitle: z.string().min(1).max(200),
  lessonSummary: z.string().max(600),
  lessonLevel: z.string().max(40).optional(),
  lessonObjectives: z.array(z.string().max(240)).max(8).optional(),
  lessonSections: z.array(z.string().max(140)).max(24).optional(),
  lessonVizTypes: z.array(z.string().max(80)).max(12).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(12),
});

interface GroqChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local-learner';
  const rate = checkRateLimit(`tutor:${clientIp}`, 12, 60_000);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Please wait ${Math.ceil(rate.resetAfterMs / 1000)}s before asking another question.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = TutorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid tutor request payload' }, { status: 400 });
  }

  const {
    lessonRouteId,
    lessonTitle,
    lessonSummary,
    lessonLevel,
    lessonObjectives,
    lessonSections,
    lessonVizTypes,
    messages,
  } = parsed.data;
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    const lastUser = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content ?? '';
    return NextResponse.json({
      reply: [
        `AI Tutor live LLM mode requires GROQ_API_KEY in your server environment.`,
        ``,
        `For "${lessonTitle}" (${lessonSummary}):`,
        `• Your question: "${lastUser.slice(0, 140)}"`,
        `• Tip: Check the interactive visualization sliders above to test edge cases, expand the Math Deep Dive callout for exact dimensions/gradients, and run the NumPy from-scratch lab to inspect intermediate tensor shapes.`,
      ].join('\n'),
      mode: 'offline-fallback',
    });
  }

  const firstUserIdx = messages.findIndex((m) => m.role === 'user');
  const trimmedMessages = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;
  if (trimmedMessages.length === 0) {
    return NextResponse.json({ error: 'At least one user message is required' }, { status: 400 });
  }

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
  const systemPrompt = buildTutorSystemPrompt({
    lessonRouteId,
    lessonTitle,
    lessonSummary,
    lessonLevel,
    lessonObjectives,
    lessonSections,
    lessonVizTypes,
    customDirectives: process.env.GROQ_SYSTEM_PROMPT,
  });

  try {
    const upstream = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 1536,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          ...trimmedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Unable to reach Groq AI service right now. Please try again shortly.' },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as GroqChatResponse;
    const rawContent = data.choices?.[0]?.message?.content ?? '';
    const reply =
      rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() ||
      'No response text returned.';

    return NextResponse.json({ reply, mode: 'groq', model });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach Groq AI service right now. Please try again shortly.' },
      { status: 502 }
    );
  }
}
