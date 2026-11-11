import type { Metadata } from 'next';
import { getGlossaryEntries } from '@/lib/content';
import { GlossaryClient } from '@/components/glossary/glossary-client';

export const metadata: Metadata = {
  title: 'ML & AI Glossary',
  description:
    'Searchable definitions and equations for Machine Learning, Deep Learning, Transformers, RL, MLOps, and AI Safety.',
};

export default function GlossaryPage() {
  const entries = getGlossaryEntries();
  return <GlossaryClient entries={entries} />;
}

