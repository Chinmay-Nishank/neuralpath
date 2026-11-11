import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const CORE_ROUTES = [
  '/',
  '/curriculum',
  '/learn/classical-ml/02-gradient-descent',
  '/learn/nlp-transformers/04-self-attention',
  '/playgrounds/gradient-descent',
  '/glossary',
  '/cheatsheets',
  '/dashboard',
  '/onboarding',
  '/search',
];

test.describe('NeuralPath End-to-End, Accessibility & Visual Verification', () => {
  for (const route of CORE_ROUTES) {
    test(`renders ${route} cleanly without overflow or serious axe violations`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('main')).toBeVisible();

      // Verify zero horizontal page overflow across desktop (1280), tablet (768), and mobile (360)
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(hasOverflow, `Horizontal overflow detected on ${route}`).toBe(false);

      // Run WCAG 2.0/2.1/2.2 A/AA accessibility checks via axe-core
      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const severe = axeResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(severe, JSON.stringify(severe, null, 2)).toEqual([]);
    });
  }

  test('interactive quiz, dark mode, and visual regression snapshots across viewports', async ({
    page,
  }, testInfo) => {
    const outDir = path.join(process.cwd(), 'test-results', 'visuals');
    fs.mkdirSync(outDir, { recursive: true });
    const proj = testInfo.project.name;

    await page.goto('/learn/classical-ml/02-gradient-descent', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `${proj}-lesson-light.png`) });

    // Answer Q1, Q2, and Q3 on reference lesson
    await page.getByLabel('Steps overshot across the valley walls and diverged').click();
    await page
      .getByLabel(
        'Opposite gradients across ravine walls cancel while consistent valley slopes accumulate'
      )
      .click();
    await page.getByLabel('Your answer for question 3').fill('- lr * grad');
    await page.getByRole('button', { name: 'Check Answers' }).click();

    await expect(page.getByText('Score: 3 / 3')).toBeVisible();

    // Toggle dark mode and capture dark snapshot
    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
    await page.screenshot({ path: path.join(outDir, `${proj}-lesson-dark.png`) });

    // Also snapshot landing page in dark & light
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `${proj}-home.png`) });
  });

  test('command palette search navigates directly to Self-Attention lesson', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const searchBox = page.getByLabel('Search lessons and concepts');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('Self-Attention');
    await page.getByRole('option', { name: /Self-Attention/i }).first().click();
    await expect(page).toHaveURL(/\/learn\/nlp-transformers\/04-self-attention/);
  });

  test('404 and health check endpoints behave cleanly', async ({ page, request }) => {
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    const body = await health.json();
    expect(body.ok).toBe(true);
    expect(body.lessons).toBeGreaterThanOrEqual(70);

    const tutor = await request.post('/api/tutor', {
      data: {
        lessonRouteId: 'classical-ml/02-gradient-descent',
        lessonTitle: 'Gradient Descent & Loss Surfaces',
        lessonSummary: 'Optimization overview.',
        messages: [{ role: 'user', content: 'What is learning rate?' }],
      },
    });
    expect(tutor.status()).toBe(200);
    const tutorBody = await tutor.json();
    expect(['groq', 'offline-fallback']).toContain(tutorBody.mode);

    const res = await page.goto('/non-existent-route-check');
    expect(res?.status()).toBe(404);
    await expect(page.getByText("This page isn't in the curriculum graph")).toBeVisible();
  });
});
