import type { MetadataRoute } from 'next';
import { getAllLessons } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const staticRoutes = [
    '',
    '/curriculum',
    '/lab',
    '/playgrounds',
    '/practice',
    '/review',
    '/placement',
    '/glossary',
    '/cheatsheets',
    '/dashboard',
    '/onboarding',
    '/search',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  const lessonEntries: MetadataRoute.Sitemap = getAllLessons().map((lesson) => ({
    url: `${baseUrl}${lesson.url}`,
    lastModified: new Date(lesson.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...lessonEntries];
}

