# NeuralPath — Design System (`DESIGN.md`)

## 1. Design Principles
1. **Content first.** The lesson is the product. Navigation and chrome stay quiet so explanations, equations, visualizations, and code hold focus.
2. **Learn by doing.** Every lesson moves purposefully between *Intuition → Interactive Visual → Math Deep Dive → Runnable Code → Exercise → Quiz*.
3. **Calm, not gamified-noisy.** Progress bars, streaks, and completion badges inform quietly without confetti explosions or intrusive modals.
4. **Consistency over novelty.** All UI derives from shared CSS tokens and accessible primitives documented in Storybook.
5. **Clarity under complexity.** Progressive disclosure protects beginners while giving researchers exact derivations and modern variants (RoPE, GQA, Flow Matching, GRPO, SAEs).

---

## 2. Color Tokens (CSS Variables)

### Neutral 12-Step Gray Scale + Tuned Dark Mode
Dark mode is carefully tuned (`#0B0E14` canvas, `#121722` elevated card, `#1A2130` interactive surface) rather than harsh `#000` inversion, ensuring sustained reading comfort and WCAG ≥ 7:1 contrast on primary body prose.

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--bg-canvas` | `#FAF9F6` | `#0B0E14` | Page background |
| `--bg-surface` | `#FFFFFF` | `#121722` | Cards, callouts, sidebar |
| `--bg-subtle` | `#F3F2EE` | `#1A2130` | Code headers, secondary panels |
| `--border-hairline` | `#E4E2DC` | `#242D3F` | 1px structural dividers |
| `--border-strong` | `#C9C5BC` | `#344058` | Input borders, active edges |
| `--text-primary` | `#14171F` | `#EEF1F6` | Headings & primary body (≥ 12:1) |
| `--text-secondary` | `#4A5162` | `#A6B0C3` | Metadata, captions, TOC (≥ 4.8:1) |
| `--text-muted` | `#666E80` | `#7E889E` | Placeholders, disabled labels |

### Single Primary Accent & Semantic Tokens
- **Primary Accent (Cobalt):** Light `#1D4ED8` (hover `#1E40AF`, soft `#EFF6FF`) | Dark `#60A5FA` (hover `#93C5FD`, soft `#172554`)
- **Success:** Light `#15803D` / `#DCFCE7` | Dark `#4ADE80` / `#052E16`
- **Warning:** Light `#B45309` / `#FEF3C7` | Dark `#FBBF24` / `#451A03`
- **Error:** Light `#B91C1C` / `#FEE2E2` | Dark `#F87171` / `#450A0A`
- **Info:** Light `#0369A1` / `#E0F2FE` | Dark `#38BDF8` / `#082F49`

### Color-Blind-Safe Chart Palette (Okabe-Ito Derived, 8 Categorical Colors)
1. `#0072B2` (Deep Blue)
2. `#E69F00` (Warm Amber)
3. `#009E73` (Bluish Green)
4. `#CC79A7` (Reddish Purple)
5. `#D55E00` (Vermilion)
6. `#56B4E9` (Sky Blue)
7. `#F0E442` (Yellow, darkened `#B8A200` on light backgrounds for contrast)
8. `#64748B` (Neutral Slate)

Heatmap Sequential Palette: `#EFF6FF → #60A5FA → #1D4ED8 → #1E1B4B` (and dark-tuned equivalent).  
Diverging Palette (Gradients / Correlations): `#D55E00` (Negative) ↔ `#E5E7EB`/`#1F2937` (Zero) ↔ `#0072B2` (Positive).

---

## 3. Typography & Measure
- **UI & Headings:** `Plus Jakarta Sans` / `Inter` (`--font-sans`)
- **Long-form Lesson Prose:** `Newsreader` / `Source Serif 4` optional toggle or clean humanist sans (`17.5px` base, `line-height: 1.7`, measure `68ch`)
- **Code & Math:** `JetBrains Mono` (`--font-mono`, `14px`, `line-height: 1.6`, tabular numbers for telemetry and metrics)
- Self-hosted automatically via `next/font/google` with `display: 'swap'`.

---

## 4. Spacing, Grid & Elevation
- **Base grid:** 4px (`0.25rem`), 8-point spacing rhythm (`8, 16, 24, 32, 48, 64px`)
- **Lesson grid:** Left sidebar (`260px`) | Center column (`max-w-[740px]` prose, `max-w-[1100px]` wide visualizations) | Right TOC & AI Tutor rail (`240px`)
- **Radii:** `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 14px`
- **Shadows:** `--shadow-sm: 0 1px 2px rgba(0,0,0,0.04)`, `--shadow-md: 0 4px 16px rgba(0,0,0,0.06)`, `--shadow-lg: 0 12px 32px rgba(0,0,0,0.10)`. Rely on 1px hairline borders first.
- **Icons:** `lucide-react` exclusively (`strokeWidth={1.5}`, sizes `16`, `20`, `24`).

---

## 5. Motion & Accessibility Standards
- **Durations:** `120ms` (micro hover/focus), `200ms` (panel/drawer), `320ms` (layout/accordion)
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)`
- **Reduced Motion:** Global CSS `@media (prefers-reduced-motion: reduce)` collapses transitions and disables autoplay animations; every animated `<Viz>` switches to a crisp step-based or static view with an explicit notice.
- **WCAG 2.2 AA:** Minimum 44x44px touch targets on controls, keyboard-accessible sliders (`ArrowLeft/Right`, `PageUp/Down`), focus-visible rings (`2px solid var(--accent)` with `2px` offset), semantic landmarks, and screen-reader summary tables beneath visual charts.

---

## 6. Component Rules (Do / Don't)
- **Do** give every visualization a title, one-line *"What to notice"* caption, labeled axes with units, legend, Reset button, and keyboard-accessible controls.
- **Do** surface learning controls beside or directly below the canvas—never buried in hidden popovers.
- **Don't** render blocking welcome modals on first load or celebratory confetti walls on lesson completion.
- **Don't** use color alone to convey pass/fail, class labels, or gradient sign—pair with icons, patterns, shapes, or explicit text.
- **Don't** allow horizontal page scroll at `360px` mobile width; wrap code blocks cleanly or scroll internally inside `overflow-x-auto` containers.

