import type { QuizQuestion } from '@/components/mdx/quiz';

export interface PracticeQuestionItem {
  uid: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonUrl: string;
  moduleId: string;
  moduleTitle: string;
  level: 'beginner' | 'practitioner' | 'researcher';
  question: QuizQuestion;
}

/**
 * Interleaves questions across different modules in round-robin buckets so consecutive
 * items switch concepts/topics rather than clustering on one subject.
 */
export function buildInterleavedSession(
  pool: PracticeQuestionItem[],
  count: number,
  seedOffset = 0
): PracticeQuestionItem[] {
  if (pool.length === 0 || count <= 0) return [];

  const buckets = new Map<string, PracticeQuestionItem[]>();
  for (const item of pool) {
    const list = buckets.get(item.moduleId) ?? [];
    list.push(item);
    buckets.set(item.moduleId, list);
  }

  const orderedModules = Array.from(buckets.keys());
  if (seedOffset > 0 && orderedModules.length > 1) {
    const shift = seedOffset % orderedModules.length;
    orderedModules.push(...orderedModules.splice(0, shift));
  }

  for (const mod of orderedModules) {
    const items = buckets.get(mod) ?? [];
    if (items.length > 1 && seedOffset > 0) {
      const s = seedOffset % items.length;
      items.push(...items.splice(0, s));
    }
  }

  const result: PracticeQuestionItem[] = [];
  let cursor = 0;

  while (result.length < count) {
    let addedInPass = false;
    for (const mod of orderedModules) {
      const items = buckets.get(mod);
      if (items && cursor < items.length) {
        result.push(items[cursor]!);
        addedInPass = true;
        if (result.length >= count) break;
      }
    }
    if (!addedInPass) break;
    cursor += 1;
  }

  return result;
}

