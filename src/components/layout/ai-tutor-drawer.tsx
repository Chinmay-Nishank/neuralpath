'use client';

import * as React from 'react';
import { Sparkles, Send, X, AlertCircle } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiTutorDrawer({
  open,
  onClose,
  lessonTitle,
  lessonSummary,
  lessonRouteId,
}: {
  open: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonSummary: string;
  lessonRouteId: string;
}) {
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Ask any question about "${lessonTitle}". I stay grounded in this lesson's concepts, equations, and Python code.`,
    },
  ]);

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    trackEvent('tutor_ask', { lessonRouteId });

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonRouteId,
          lessonTitle,
          lessonSummary,
          messages: nextMessages.slice(-8),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Tutor request failed.');
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply ?? 'No response generated.' },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI Tutor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      aria-label="AI Tutor Sidebar"
      className="fixed bottom-4 right-4 z-50 flex h-[480px] w-[92vw] max-w-md flex-col overflow-hidden rounded-lg border border-strong bg-surface shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-hairline bg-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <div>
            <div className="text-xs font-semibold text-primary">NeuralPath AI Tutor</div>
            <div className="max-w-[240px] truncate text-[11px] text-primary-muted">
              Scoped to: {lessonTitle}
            </div>
          </div>
        </div>
        <IconButton variant="ghost" size="icon-sm" label="Close AI Tutor" onClick={onClose}>
          <X className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs leading-relaxed">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`rounded-md p-3 ${
              m.role === 'user'
                ? 'ml-8 bg-accent text-accent-foreground'
                : 'mr-4 border border-hairline bg-canvas text-primary'
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="mr-4 rounded-md border border-hairline bg-canvas p-3 text-primary-muted">
            Thinking through the derivation...
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft/40 p-3 text-primary"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-hairline bg-surface p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about an equation, hyperparameter, or bug..."
          aria-label="Ask AI Tutor a question"
          className="h-9 flex-1 rounded-sm border border-strong bg-canvas px-3 text-xs text-primary placeholder:text-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button type="submit" size="sm" loading={loading} aria-label="Send message">
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </form>
    </aside>
  );
}

