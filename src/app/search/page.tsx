import * as React from 'react';
import type { Metadata } from 'next';
import { getModules, getSearchableLessons } from '@/lib/content';
import { SearchClient } from '@/components/search/search-client';

export const metadata: Metadata = {
  title: 'Search Curriculum',
  description: 'Search all NeuralPath ML, Deep Learning, Transformers, and AI lessons.',
};

export default function SearchPage() {
  const lessons = getSearchableLessons();
  const modules = getModules();

  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-[1040px] px-4 py-10 text-sm text-primary-secondary">
          Loading search index...
        </div>
      }
    >
      <SearchClient lessons={lessons} modules={modules} />
    </React.Suspense>
  );
}

