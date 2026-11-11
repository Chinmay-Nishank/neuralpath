import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { PLAYGROUNDS } from '@/lib/playgrounds';
import { Viz } from '@/components/mdx/viz';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export const dynamicParams = false;

export async function generateStaticParams() {
  return PLAYGROUNDS.map((pg) => ({ viz: pg.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ viz: string }>;
}): Promise<Metadata> {
  const { viz } = await params;
  const pg = PLAYGROUNDS.find((item) => item.slug === viz);
  if (!pg) return {};
  return {
    title: pg.title,
    description: pg.description,
  };
}

export default async function PlaygroundDetailPage({
  params,
}: {
  params: Promise<{ viz: string }>;
}) {
  const { viz } = await params;
  const pg = PLAYGROUNDS.find((item) => item.slug === viz);
  if (!pg) notFound();

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
        <div className="space-y-2">
          <Breadcrumbs
            items={[
              { label: 'Playgrounds', href: '/playgrounds' },
              { label: pg.title },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {pg.title}
            </h1>
            <Badge variant="accent">{pg.category}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-primary-secondary">{pg.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/playgrounds"
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-strong bg-surface px-3 text-xs font-medium text-primary hover:bg-subtle"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All Playgrounds
          </Link>
          <Link
            href={pg.lessonUrl}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-3 text-xs font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Read Accompanying Lesson
          </Link>
        </div>
      </div>

      <Viz type={pg.slug} />
    </div>
  );
}

