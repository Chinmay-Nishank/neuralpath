import { z } from 'zod';
import { getAllLessons, getModules } from '@/lib/content';
import {
  buildInterleavedSession,
  type PracticeQuestionItem,
} from './practice-session';

export { buildInterleavedSession, type PracticeQuestionItem };

const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['mcq', 'fill-blank', 'code-completion']),
  prompt: z.string().min(1),
  codeSnippet: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.number()]),
  acceptableAnswers: z.array(z.string()).optional(),
  explanation: z.string().min(1),
});

/**
 * Minimal pure recursive-descent parser for static MDX JS object/array literals
 * without using eval or new Function.
 */
function parseJsLiteral(source: string): unknown {
  let pos = 0;

  const skipWhitespaceAndComments = () => {
    while (pos < source.length) {
      const ch = source[pos] ?? '';
      if (/\s/.test(ch)) {
        pos += 1;
        continue;
      }
      if (ch === '/' && source[pos + 1] === '/') {
        pos += 2;
        while (pos < source.length && source[pos] !== '\n') pos += 1;
        continue;
      }
      if (ch === '/' && source[pos + 1] === '*') {
        pos += 2;
        while (pos < source.length && !(source[pos] === '*' && source[pos + 1] === '/')) {
          pos += 1;
        }
        pos += 2;
        continue;
      }
      break;
    }
  };

  const parseString = (quote: string): string => {
    pos += 1;
    let out = '';
    while (pos < source.length) {
      const ch = source[pos] ?? '';
      if (ch === '\\') {
        const next = source[pos + 1] ?? '';
        if (next === 'n') out += '\n';
        else if (next === 't') out += '\t';
        else if (next === 'r') out += '\r';
        else out += next;
        pos += 2;
        continue;
      }
      if (ch === quote) {
        pos += 1;
        return out;
      }
      out += ch;
      pos += 1;
    }
    throw new Error('Unterminated string literal in quiz block');
  };

  const parseIdentifier = (): string => {
    let id = '';
    while (pos < source.length) {
      const ch = source[pos] ?? '';
      if (/[A-Za-z0-9_$]/.test(ch)) {
        id += ch;
        pos += 1;
      } else {
        break;
      }
    }
    return id;
  };

  const parseValue = (): unknown => {
    skipWhitespaceAndComments();
    const ch = source[pos];
    if (ch === '[') {
      pos += 1;
      const arr: unknown[] = [];
      skipWhitespaceAndComments();
      while (pos < source.length && source[pos] !== ']') {
        arr.push(parseValue());
        skipWhitespaceAndComments();
        if (source[pos] === ',') {
          pos += 1;
          skipWhitespaceAndComments();
        } else {
          break;
        }
      }
      if (source[pos] === ']') pos += 1;
      return arr;
    }

    if (ch === '{') {
      pos += 1;
      const obj: Record<string, unknown> = {};
      skipWhitespaceAndComments();
      while (pos < source.length && source[pos] !== '}') {
        let key: string;
        if (source[pos] === '"' || source[pos] === "'" || source[pos] === '`') {
          key = parseString(source[pos]!);
        } else {
          key = parseIdentifier();
        }
        if (!key) break;
        skipWhitespaceAndComments();
        if (source[pos] === ':') pos += 1;
        const val = parseValue();
        obj[key] = val;
        skipWhitespaceAndComments();
        if (source[pos] === ',') {
          pos += 1;
          skipWhitespaceAndComments();
        } else {
          break;
        }
      }
      if (source[pos] === '}') pos += 1;
      return obj;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      return parseString(ch);
    }

    if (ch === '-' || /[0-9]/.test(ch ?? '')) {
      let numStr = '';
      if (ch === '-') {
        numStr += '-';
        pos += 1;
      }
      while (pos < source.length && /[0-9.eE+-]/.test(source[pos] ?? '')) {
        numStr += source[pos];
        pos += 1;
      }
      return Number(numStr);
    }

    const word = parseIdentifier();
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'null') return null;
    throw new Error(`Unexpected token "${word}" in quiz literal`);
  };

  return parseValue();
}

function extractQuestionsArraySlice(rawMdx: string): string | null {
  const quizIdx = rawMdx.indexOf('<Quiz');
  if (quizIdx === -1) return null;
  const qPropIdx = rawMdx.indexOf('questions={', quizIdx);
  if (qPropIdx === -1) return null;

  const startBracket = rawMdx.indexOf('[', qPropIdx);
  if (startBracket === -1) return null;

  let depth = 0;
  let inQuote: string | null = null;
  let escaped = false;

  for (let i = startBracket; i < rawMdx.length; i++) {
    const ch = rawMdx[i] ?? '';
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inQuote) {
      if (ch === '\\') {
        escaped = true;
      } else if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inQuote = ch;
      continue;
    }
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return rawMdx.slice(startBracket, i + 1);
      }
    }
  }
  return null;
}

export function extractPracticeQuizBank(): PracticeQuestionItem[] {
  const modules = new Map<string, string>(getModules().map((m) => [m.id, m.title]));
  const lessons = getAllLessons();
  const bank: PracticeQuestionItem[] = [];

  for (const lesson of lessons) {
    const slice = extractQuestionsArraySlice(lesson.raw);
    if (!slice) continue;
    try {
      const parsed = parseJsLiteral(slice);
      const valid = z.array(QuizQuestionSchema).safeParse(parsed);
      if (!valid.success) continue;
      for (const q of valid.data) {
        bank.push({
          uid: `${lesson.routeId}::${q.id}`,
          lessonSlug: lesson.routeId,
          lessonTitle: lesson.title,
          lessonUrl: lesson.url,
          moduleId: lesson.module,
          moduleTitle: modules.get(lesson.module) ?? lesson.module,
          level: lesson.level,
          question: q,
        });
      }
    } catch {
      // Skip non-standard inline props cleanly
    }
  }

  return bank;
}

