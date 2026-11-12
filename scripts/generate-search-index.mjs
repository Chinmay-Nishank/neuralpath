import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const lessonsPath = path.join(ROOT, '.velite', 'lessons.json');
const modulesPath = path.join(ROOT, 'content', 'modules.yaml');
const outDir = path.join(ROOT, 'public', 'data');
const outPath = path.join(outDir, 'search-index.json');

if (fs.existsSync(lessonsPath) && fs.existsSync(modulesPath)) {
  const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
  const modules = yaml.load(fs.readFileSync(modulesPath, 'utf8'));
  const modMap = new Map(modules.map((m) => [m.id, m.title]));

  const searchIndex = lessons.map((l) => ({
    routeId: l.routeId,
    title: l.title,
    module: l.module,
    moduleTitle: modMap.get(l.module) || l.module,
    level: l.level,
    estimatedMinutes: l.estimatedMinutes,
    summary: l.summary,
    tags: l.tags || [],
    url: l.url,
  }));

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(searchIndex, null, 2));
  console.log(`[Search Index] Generated ${searchIndex.length} searchable lessons at ${outPath}`);
}

