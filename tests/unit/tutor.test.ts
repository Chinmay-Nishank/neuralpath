import { describe, expect, it, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/tutor/route';

describe('/api/tutor (Groq AI Tutor)', () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalKey;
    }
    if (originalModel === undefined) {
      delete process.env.GROQ_MODEL;
    } else {
      process.env.GROQ_MODEL = originalModel;
    }
  });

  it('rejects invalid payloads with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'test-invalid' },
      body: JSON.stringify({ lessonRouteId: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('falls back cleanly when GROQ_API_KEY is unset', async () => {
    delete process.env.GROQ_API_KEY;
    const req = new NextRequest('http://localhost:3000/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'test-offline' },
      body: JSON.stringify({
        lessonRouteId: 'classical-ml/02-gradient-descent',
        lessonTitle: 'Gradient Descent & Loss Surfaces',
        lessonSummary: 'Optimization overview.',
        messages: [
          { role: 'assistant', content: 'Welcome!' },
          { role: 'user', content: 'Why does SGD oscillate?' },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string; reply: string };
    expect(body.mode).toBe('offline-fallback');
    expect(body.reply).toContain('GROQ_API_KEY');
  });

  it('calls Groq chat completions with configured model when GROQ_API_KEY is set', async () => {
    process.env.GROQ_API_KEY = 'test-api-key';
    process.env.GROQ_MODEL = 'openai/gpt-oss-120b';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Gradient points uphill; subtracting steps downhill.' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const req = new NextRequest('http://localhost:3000/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'test-live' },
      body: JSON.stringify({
        lessonRouteId: 'classical-ml/02-gradient-descent',
        lessonTitle: 'Gradient Descent & Loss Surfaces',
        lessonSummary: 'Optimization overview.',
        messages: [{ role: 'user', content: 'Why subtract the gradient?' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mode: string; model: string; reply: string };
    expect(body.mode).toBe('groq');
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.reply).toContain('steps downhill');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    const sent = JSON.parse(String(init?.body)) as { model: string; max_completion_tokens: number };
    expect(sent.model).toBe('openai/gpt-oss-120b');
    expect(sent.max_completion_tokens).toBe(1536);
  });
});
