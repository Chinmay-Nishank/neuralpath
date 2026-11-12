'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [msg, setMsg] = React.useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'newsletter', email }),
      });
      if (!res.ok) throw new Error('Please enter a valid email address.');
      setStatus('done');
      setMsg('Subscribed. Watch for new lessons and errata updates.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMsg(err instanceof Error ? err.message : 'Subscription failed.');
    }
  };

  return (
    <footer className="cv-auto border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div className="space-y-3">
          <div className="text-base font-semibold text-primary">NeuralPath</div>
          <p className="text-xs leading-relaxed text-primary-secondary">
            Open-source interactive Machine Learning, Deep Learning, and AI curriculum from linear
            algebra to modern transformers, RLHF, and production deployment.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="font-semibold text-primary">Learn</div>
          <ul className="space-y-0.5 text-primary-secondary">
            <li><Link href="/curriculum" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Curriculum Map</Link></li>
            <li><Link href="/placement" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Diagnostic Placement</Link></li>
            <li><Link href="/lab" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">From-Scratch Python Lab</Link></li>
            <li><Link href="/practice" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Mixed Practice Arena</Link></li>
            <li><Link href="/review" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Flashcard Review</Link></li>
            <li><Link href="/dashboard" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Progress Dashboard</Link></li>
          </ul>
        </div>

        <div className="space-y-2 text-xs">
          <div className="font-semibold text-primary">Reference</div>
          <ul className="space-y-0.5 text-primary-secondary">
            <li><Link href="/playgrounds" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Interactive 3D Playgrounds</Link></li>
            <li><Link href="/glossary" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">ML/AI Glossary</Link></li>
            <li><Link href="/cheatsheets" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">PDF Cheatsheets</Link></li>
            <li><Link href="/search" className="inline-flex min-h-[26px] items-center py-1 hover:text-primary">Full-Text Search</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-primary">Curriculum Release Notes</div>
          <p className="text-xs text-primary-secondary">
            Occasional updates when new frontier lessons or interactive labs ship.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                aria-label="Email address for curriculum updates"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="md" loading={status === 'submitting'}>
              Subscribe
            </Button>
          </form>
          {msg && (
            <p className={`text-xs ${status === 'error' ? 'text-danger' : 'text-success'}`}>
              {msg}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-hairline px-4 py-4 text-center text-xs text-primary-muted">
        NeuralPath Open Educational Curriculum · Built for interactive mastery
      </div>
    </footer>
  );
}

