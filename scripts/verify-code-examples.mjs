import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const LESSONS_DIR = path.join(ROOT, 'content', 'lessons');
const DATASETS_DIR = path.join(ROOT, 'public', 'datasets').replace(/\\/g, '/');

function walkMdx(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMdx(full));
    else if (entry.name.endsWith('.mdx')) results.push(full);
  }
  return results.sort();
}

function extractPropBacktick(blockText, propName) {
  const markerTight = `${propName}={\``;
  const idx = blockText.indexOf(markerTight);
  if (idx === -1) return null;
  let pos = idx + markerTight.length;
  let out = '';
  while (pos < blockText.length) {
    const ch = blockText[pos];
    if (ch === '\\' && pos + 1 < blockText.length) {
      const next = blockText[pos + 1];
      if (next === '`' || next === '$') {
        out += next;
        pos += 2;
        continue;
      }
      out += ch;
      pos += 1;
      continue;
    }
    if (ch === '`' && blockText[pos + 1] === '}') {
      return out;
    }
    out += ch;
    pos += 1;
  }
  return null;
}

function extractTitle(blockText) {
  const m = blockText.match(/title="([^"]+)"/);
  return m?.[1] ?? 'Untitled CodeRunner';
}

function extractCodeRunnerBlocks(mdxContent) {
  const blocks = [];
  let searchFrom = 0;
  while (true) {
    const start = mdxContent.indexOf('<CodeRunner', searchFrom);
    if (start === -1) break;
    let pos = start + '<CodeRunner'.length;
    let inBacktick = false;
    let inDoubleQuote = false;
    let end = -1;
    while (pos < mdxContent.length) {
      const ch = mdxContent[pos];
      if (ch === '\\') {
        pos += 2;
        continue;
      }
      if (!inDoubleQuote && ch === '`') {
        inBacktick = !inBacktick;
      } else if (!inBacktick && ch === '"') {
        inDoubleQuote = !inDoubleQuote;
      } else if (!inBacktick && !inDoubleQuote && ch === '/' && mdxContent[pos + 1] === '>') {
        end = pos + 2;
        break;
      }
      pos += 1;
    }
    if (end === -1) break;
    blocks.push(mdxContent.slice(start, end));
    searchFrom = end;
  }
  return blocks;
}

function main() {
  const files = walkMdx(LESSONS_DIR);
  let totalBlocks = 0;
  const snippets = [];

  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = extractCodeRunnerBlocks(content);

    if (blocks.length === 0) {
      throw new Error(`Lesson ${rel} is missing a <CodeRunner /> example!`);
    }

    for (const block of blocks) {
      totalBlocks += 1;
      const title = extractTitle(block);
      const code = extractPropBacktick(block, 'code');
      const libraryCode = extractPropBacktick(block, 'libraryCode');
      const colabCode = extractPropBacktick(block, 'colabCode');
      const exerciseSolution = extractPropBacktick(block, 'exerciseSolution');
      const exerciseTests = extractPropBacktick(block, 'exerciseTests');

      if (!code) {
        throw new Error(`${rel} (${title}): missing runnable 'code' prop`);
      }

      const prep = (src) => src.replaceAll('/datasets/', `${DATASETS_DIR}/`);

      snippets.push({ label: `${rel} :: ${title} [scratch]`, code: prep(code) });
      if (libraryCode) {
        snippets.push({ label: `${rel} :: ${title} [library]`, code: prep(libraryCode) });
      }
      if (colabCode) {
        snippets.push({ label: `${rel} :: ${title} [colab]`, code: prep(colabCode) });
      }
      if (exerciseSolution && exerciseTests) {
        snippets.push({
          label: `${rel} :: ${title} [exercise+tests]`,
          code: prep(`${exerciseSolution}\n\n${exerciseTests}`),
        });
      }
    }
  }

  const payloadFile = path.join(os.tmpdir(), `neuralpath-snippets-${process.pid}.json`);
  const runnerFile = path.join(os.tmpdir(), `neuralpath-runner-${process.pid}.py`);

  fs.writeFileSync(payloadFile, JSON.stringify(snippets), 'utf8');
  fs.writeFileSync(
    runnerFile,
    `import json, sys, io, contextlib, traceback

with open(${JSON.stringify(payloadFile)}, "r", encoding="utf-8") as f:
    items = json.load(f)

failures = []
for item in items:
    ns = {"__name__": "__main__"}
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(item["code"], item["label"], "exec"), ns)
    except Exception:
        failures.append(f"FAILED: {item['label']}\\n{traceback.format_exc()}")

if failures:
    print("\\n---\\n".join(failures), file=sys.stderr)
    sys.exit(1)

print(f"Executed {len(items)} Python blocks cleanly.")
`,
    'utf8'
  );

  try {
    const out = execFileSync('python', [runnerFile], {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120_000,
    });
    console.log(`Verified ${files.length} lessons, ${totalBlocks} CodeRunner blocks. ${out.trim()}`);
  } catch (err) {
    const stderr = err?.stderr ? String(err.stderr) : String(err);
    throw new Error(`Python code verification failed:\n${stderr}`);
  } finally {
    if (fs.existsSync(payloadFile)) fs.unlinkSync(payloadFile);
    if (fs.existsSync(runnerFile)) fs.unlinkSync(runnerFile);
  }
}

main();
