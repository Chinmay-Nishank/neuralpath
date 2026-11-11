# Contributing to NeuralPath

Thank you for helping improve NeuralPath! Every lesson is a self-contained `.mdx` file under `content/lessons/<module>/`.

## Adding a New Lesson

1. Create a file under `content/lessons/<module-order>-<module-id>/<order>-<slug>.mdx`.
2. Fill all required typed frontmatter fields validated by `velite.config.ts`:
   - `title`, `module`, `moduleOrder`, `order`, `level`, `paths`, `estimatedMinutes`
   - `prerequisites` (array of `"module/lesson-slug"` IDs)
   - `objectives` (2–6 clear measurable outcomes)
   - `summary`, `tags`, `vizTypes`, `updatedAt`
3. Structure the lesson following `CONTENT_STYLE_GUIDE.md`:
   - Intuition -> Interactive `<Viz>` -> Progressive Math `<Callout type="math-deep-dive">` -> `<CodeRunner>` (scratch + library + exercise with tests) -> `<Quiz>` -> `<KeyTakeaways>`.
4. Verify locally before opening a PR:
   ```bash
   npm run verify:code   # Executes every Python code block and exercise assertion
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

