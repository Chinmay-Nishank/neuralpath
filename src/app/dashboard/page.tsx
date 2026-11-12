import type { Metadata } from 'next';
import {
  getLessonsForPath,
  getModules,
  getSearchableLessons,
} from '@/lib/content';
import { DashboardClient } from '@/components/progress/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your NeuralPath streaks, module badges, saved bookmarks, and lesson notes.',
};

export default function DashboardPage() {
  const modules = getModules();
  const lessons = getSearchableLessons();
  const pathLessons = {
    beginner: getLessonsForPath('beginner').map((l) => l.routeId),
    practitioner: getLessonsForPath('practitioner').map((l) => l.routeId),
    researcher: getLessonsForPath('researcher').map((l) => l.routeId),
  };

  return <DashboardClient modules={modules} lessons={lessons} pathLessons={pathLessons} />;
}

