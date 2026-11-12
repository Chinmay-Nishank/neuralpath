import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, defineCollection, s } from 'velite';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { loadCardsFromDirectory } from './src/lib/cards';

const MODULE_IDS = [
  'foundations',
  'classical-ml',
  'deep-learning',
  'computer-vision',
  'nlp-transformers',
  'generative-ai',
  'reinforcement-learning',
  'mlops',
  'ai-safety',
  'capstones',
] as const;

const lessons = defineCollection({
  name: 'Lesson',
  pattern: 'lessons/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(140),
      module: s.enum(MODULE_IDS),
      moduleOrder: s.number().int().min(1).max(10),
      order: s.number().int().min(1).max(20),
      level: s.enum(['beginner', 'practitioner', 'researcher']),
      paths: s.array(s.enum(['beginner', 'practitioner', 'researcher'])).min(1),
      estimatedMinutes: s.number().int().min(5).max(120),
      prerequisites: s.array(s.string()).default([]),
      objectives: s.array(s.string()).min(2).max(6),
      summary: s.string().max(300),
      tags: s.array(s.string()).default([]),
      vizTypes: s.array(s.string()).default([]),
      colabNotebook: s.string().optional(),
      hasScratchCode: s.boolean().default(true),
      hasLibraryCode: s.boolean().default(true),
      hasExercise: s.boolean().default(true),
      published: s.boolean().default(true),
      updatedAt: s.isodate(),
      slug: s.path(),
      body: s.mdx(),
      toc: s.toc(),
      raw: s.raw(),
      metadata: s.metadata(),
    })
    .transform((data) => {
      // slug comes out as "lessons/01-foundations/01-what-is-a-model"
      const parts = data.slug.split('/');
      const lessonSlug = parts[parts.length - 1] ?? data.slug;
      const routeId = `${data.module}/${lessonSlug}`;
      return {
        ...data,
        lessonSlug,
        routeId,
        url: `/learn/${data.module}/${lessonSlug}`,
      };
    }),
});

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: { lessons },
  prepare(data) {
    const cardsDir = path.join(process.cwd(), 'content', 'cards');
    const cards = loadCardsFromDirectory(cardsDir);
    const knownLessons = new Set(data.lessons.map((l) => l.routeId));
    for (const card of cards) {
      if (!knownLessons.has(card.lessonSlug)) {
        throw new Error(
          `Spaced-repetition card "${card.id}" references unknown lessonSlug "${card.lessonSlug}"`
        );
      }
    }
  },
  complete() {
    const cardsDir = path.join(process.cwd(), 'content', 'cards');
    const cards = loadCardsFromDirectory(cardsDir);
    const outPath = path.join(process.cwd(), '.velite', 'cards.json');
    fs.writeFileSync(outPath, `${JSON.stringify(cards, null, 2)}\n`, 'utf8');
  },
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            className: ['heading-anchor'],
          },
        },
      ],
      rehypeKatex,
    ],
  },
});

