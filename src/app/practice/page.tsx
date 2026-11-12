import type { Metadata } from 'next';
import { extractPracticeQuizBank } from '@/lib/quiz-bank';
import { PracticeClient } from '@/components/practice/practice-client';

export const metadata: Metadata = {
  title: 'Interleaved Mixed Practice',
  description:
    'Strengthen retention by practicing interleaved questions mixed across ML foundations, optimization, deep learning, vision, transformers, and safety.',
};

export default function PracticePage() {
  const bank = extractPracticeQuizBank();
  return <PracticeClient bank={bank} />;
}

