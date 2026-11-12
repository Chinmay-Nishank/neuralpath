import type { Metadata } from 'next';
import { getAllCards } from '@/lib/cards';
import { getAllLessons } from '@/lib/content';
import { ReviewClient, type ReviewLessonInfo } from '@/components/review/review-client';

export const metadata: Metadata = {
  title: 'Spaced Repetition Review',
  description:
    'Daily FSRS active-recall flashcards unlocked progressively as you complete NeuralPath lessons.',
};

export default function ReviewPage() {
  const cards = getAllCards();
  const lessons: ReviewLessonInfo[] = getAllLessons().map((l) => ({
    routeId: l.routeId,
    title: l.title,
    url: l.url,
  }));

  return <ReviewClient cards={cards} lessons={lessons} />;
}
