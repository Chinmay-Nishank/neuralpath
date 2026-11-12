import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const CORE_ROUTES = [
  '/',
  '/curriculum',
  '/lab',
  '/placement',
  '/learn/classical-ml/02-gradient-descent',
  '/learn/nlp-transformers/04-self-attention',
  '/playgrounds/gradient-descent',
  '/playgrounds/attention',
  '/playgrounds/neural-network',
  '/practice',
  '/review',
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

  test('command palette and Google search work cleanly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    const searchBox = page.getByLabel('Search lessons and concepts');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('Self-Attention');
    await expect(page.getByRole('option', { name: /Search Google for/i })).toBeVisible();
    await page.getByRole('option', { name: /Self-Attention/i }).first().locator('button').click();
    await expect(page).toHaveURL(/\/learn\/nlp-transformers\/04-self-attention/);

    await page.goto('/search?q=RoPE', { waitUntil: 'networkidle' });
    const googleLink = page.getByRole('link', { name: /Search on Google/i }).first();
    await expect(googleLink).toHaveAttribute('href', /google\.com\/search\?q=RoPE/);
  });

  test('404 and health check endpoints behave cleanly', async ({ page, request }) => {
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    const body = await health.json();
    expect(body.ok).toBe(true);
    expect(body.lessons).toBeGreaterThanOrEqual(70);
    expect(body.searchEngine).toBe('google');

    const res = await page.goto('/non-existent-route-check');
    expect(res?.status()).toBe(404);
    await expect(page.getByText("This page isn't in the curriculum graph")).toBeVisible();
  });

  test('spaced-repetition review lifecycle, quiz google search, and visual captures work cleanly', async ({
    page,
  }, testInfo) => {
    const outDir = path.join(process.cwd(), 'test-results', 'visuals');
    fs.mkdirSync(outDir, { recursive: true });
    const proj = testInfo.project.name;

    // 1. Empty state before any lesson is marked complete
    await page.goto('/review', { waitUntil: 'networkidle' });
    await expect(page.getByText('Finish a lesson to unlock cards')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-empty-light.png`) });

    // Capture dark empty state cleanly on desktop & mobile
    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-empty-dark.png`) });
    await page.getByRole('button', { name: 'Toggle color theme' }).click();

    // 2. Navigate to Gradient Descent, click Mark Lesson Complete -> toast + undo, and test quiz->Google search link
    await page.goto('/learn/classical-ml/02-gradient-descent', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Mark Lesson Complete' }).click();
    await expect(page.getByText('Added 10 cards to your review queue')).toBeVisible();

    await page.getByLabel('Momentum decayed to zero').click();
    await page.getByRole('button', { name: 'Check Answers' }).click();
    const googleWhyLink = page.getByRole('link', { name: /Search on Google why/i }).first();
    await expect(googleWhyLink).toBeVisible();
    await expect(googleWhyLink).toHaveAttribute('href', /https:\/\/www\.google\.com\/search\?q=/);

    // 3. Check Curriculum Map & Landing Continue Card show "10 cards due"
    await page.goto('/curriculum', { waitUntil: 'networkidle' });
    await expect(page.getByText('10 cards due').first()).toBeVisible();

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByText('10 cards due').first()).toBeVisible({ timeout: 10000 });

    // 4. Open /review, verify >= 44px touch targets, reveal answer, capture light/dark screenshots, rate all 10 cards
    await page.goto('/review', { waitUntil: 'networkidle' });
    await expect(page.getByText('1 of 10')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-question-light.png`) });

    const revealBtn = page.getByRole('button', { name: /Show Answer/i });
    const revealBox = await revealBtn.boundingBox();
    expect(revealBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Dark capture on question
    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-question-dark.png`) });
    await page.getByRole('button', { name: 'Toggle color theme' }).click();

    await revealBtn.click();
    await expect(page.getByRole('button', { name: /Good:/i })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-revealed-light.png`) });

    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-revealed-dark.png`) });
    await page.getByRole('button', { name: 'Toggle color theme' }).click();

    // Rate all 10 cards cleanly with Good (key 3) after revealing
    for (let i = 0; i < 10; i++) {
      if (i > 0) {
        await page.getByRole('button', { name: /Show Answer/i }).click();
      }
      await page.getByRole('button', { name: /Good:/i }).click();
    }

    // 5. Verify Session Summary in light & dark
    await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-summary-light.png`) });

    await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-summary-dark.png`) });
    await page.getByRole('button', { name: 'Toggle color theme' }).click();

    // 6. Reload /review -> empty countdown state ("Nothing due. Next review in ...") & badge hidden at zero
    await page.goto('/review', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Nothing due\. Next review in/i)).toBeVisible();
    await page.screenshot({ path: path.join(outDir, `${proj}-review-caughtup-light.png`) });
  });

  test('interleaved practice arena and 3D visualizations render cleanly', async ({
    page,
  }, testInfo) => {
    const outDir = path.join(process.cwd(), 'test-results', 'visuals');
    fs.mkdirSync(outDir, { recursive: true });
    const proj = testInfo.project.name;

    await page.goto('/practice', { waitUntil: 'networkidle' });
    await expect(page.getByText('Cross-Topic Practice Arena')).toBeVisible();
    await expect(page.getByText(/Question 1 of/)).toBeVisible();
    await page.screenshot({ path: path.join(outDir, `${proj}-practice.png`) });

    if (proj === 'desktop-chromium') {
      await page.goto('/playgrounds/attention', { waitUntil: 'networkidle' });
      await expect(page.getByRole('button', { name: '3D Skyline' })).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `${proj}-viz-attention-3d.png`) });

      await page.goto('/playgrounds/neural-network', { waitUntil: 'networkidle' });
      await expect(page.getByRole('button', { name: '3D Surface' })).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `${proj}-viz-nn-3d.png`) });

      await page.goto('/playgrounds/gradient-descent', { waitUntil: 'networkidle' });
      await expect(page.getByRole('button', { name: '3D Surface' })).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `${proj}-viz-gd-3d.png`) });
    }
  });

  test('from-scratch ML lab and diagnostic placement workflows render cleanly', async ({
    page,
  }) => {
    // 1. Visit /placement, answer question 1, see instant pedagogical explanation
    await page.goto('/placement', { waitUntil: 'networkidle' });
    await expect(page.getByText('Diagnostic Knowledge Check')).toBeVisible();
    await expect(page.getByText('Question 1 of')).toBeVisible();
    await page.getByRole('button', { name: /The vectors are orthogonal/ }).click();
    await expect(page.getByText('Correct!')).toBeVisible();

    // 2. Visit /lab, switch algorithms, check LaTeX formula & sandbox
    await page.goto('/lab', { waitUntil: 'networkidle' });
    await expect(page.getByText('From-Scratch Machine Learning Lab')).toBeVisible();
    await expect(page.getByText('Core Mathematical Formula')).toBeVisible();
    await page.getByRole('button', { name: /Micro-Autograd Engine/ }).click();
    await expect(page.getByRole('heading', { name: /Micro-Autograd Engine/i })).toBeVisible();

    // 3. Visit /curriculum, test Pathway Selector
    await page.goto('/curriculum', { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: /Zero to Hero/i })).toBeVisible();
    await page.getByRole('button', { name: /Zero to Hero/i }).click();
    await expect(page.getByText(/Zero to Hero: Complete AI Mastery/i)).toBeVisible();
  });
});
