import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { lessons as rawLessons, type Lesson } from '@velite';

export type ModuleId = Lesson['module'];
export type LevelId = Lesson['level'];
export type PathId = 'beginner' | 'practitioner' | 'researcher';

export interface ModuleMeta {
  id: ModuleId;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  level: LevelId;
  estimatedHours: number;
  badgeTitle: string;
  colorVar: string;
}

export interface GlossaryEntry {
  term: string;
  aliases?: string[];
  definition: string;
  formula?: string;
  lessonUrl: string;
}

let cachedModules: ModuleMeta[] | null = null;
let cachedGlossary: GlossaryEntry[] | null = null;

export function getModules(): ModuleMeta[] {
  if (cachedModules) return cachedModules;
  const filePath = path.join(process.cwd(), 'content', 'modules.yaml');
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = (yaml.load(raw) as ModuleMeta[]) ?? [];
  cachedModules = parsed.sort((a, b) => a.order - b.order);
  return cachedModules;
}

export function getModuleById(id: string): ModuleMeta | undefined {
  return getModules().find((m) => m.id === id);
}

export function getGlossaryEntries(): GlossaryEntry[] {
  if (cachedGlossary) return cachedGlossary;
  const filePath = path.join(process.cwd(), 'content', 'glossary.yaml');
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = (yaml.load(raw) as GlossaryEntry[]) ?? [];
  cachedGlossary = parsed.sort((a, b) => a.term.localeCompare(b.term));
  return cachedGlossary;
}

export function findGlossaryTerm(query: string): GlossaryEntry | undefined {
  const lower = query.trim().toLowerCase();
  return getGlossaryEntries().find(
    (entry) =>
      entry.term.toLowerCase() === lower ||
      entry.aliases?.some((alias) => alias.toLowerCase() === lower)
  );
}

export function getAllLessons(): Lesson[] {
  return rawLessons
    .filter((l) => l.published)
    .slice()
    .sort((a, b) => {
      if (a.moduleOrder !== b.moduleOrder) return a.moduleOrder - b.moduleOrder;
      return a.order - b.order;
    });
}

export function getLesson(moduleId: string, lessonSlug: string): Lesson | undefined {
  return getAllLessons().find(
    (l) => l.module === moduleId && l.lessonSlug === lessonSlug
  );
}

export function getLessonByRouteId(routeId: string): Lesson | undefined {
  return getAllLessons().find((l) => l.routeId === routeId);
}

export function getLessonsForModule(moduleId: string): Lesson[] {
  return getAllLessons().filter((l) => l.module === moduleId);
}

export function getLessonsForPath(pathId: PathId): Lesson[] {
  return getAllLessons().filter((l) => l.paths.includes(pathId));
}

export function getAdjacentLessons(lesson: Lesson): {
  prev: Lesson | null;
  next: Lesson | null;
} {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.routeId === lesson.routeId);
  return {
    prev: idx > 0 ? all[idx - 1] ?? null : null,
    next: idx >= 0 && idx < all.length - 1 ? all[idx + 1] ?? null : null,
  };
}

export function getRelatedLessons(lesson: Lesson, limit = 3): Lesson[] {
  const all = getAllLessons().filter((l) => l.routeId !== lesson.routeId);
  const scored = all.map((candidate) => {
    let score = 0;
    if (lesson.prerequisites.includes(candidate.routeId)) score += 4;
    if (candidate.prerequisites.includes(lesson.routeId)) score += 4;
    if (candidate.module === lesson.module) score += 2;
    for (const tag of candidate.tags) {
      if (lesson.tags.includes(tag)) score += 1;
    }
    return { candidate, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.candidate);
}

export interface SearchableLessonSummary {
  routeId: string;
  title: string;
  module: string;
  moduleTitle: string;
  level: string;
  estimatedMinutes: number;
  summary: string;
  tags: string[];
  url: string;
}

export function getSearchableLessons(): SearchableLessonSummary[] {
  const modulesMap = new Map(getModules().map((m) => [m.id, m.title]));
  return getAllLessons().map((l) => ({
    routeId: l.routeId,
    title: l.title,
    module: l.module,
    moduleTitle: modulesMap.get(l.module) ?? l.module,
    level: l.level,
    estimatedMinutes: l.estimatedMinutes,
    summary: l.summary,
    tags: l.tags,
    url: l.url,
  }));
}

