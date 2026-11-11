# NeuralPath — Architecture & Content Plan

## 1. Overview
**NeuralPath** is an open-source, interactive Machine Learning, Deep Learning, and AI learning platform built with Next.js 15 (App Router) and TypeScript (`strict: true`). A learner with basic programming knowledge progresses from *"what is a model?"* to *"I can train and deploy a transformer"* using self-contained MDX lessons, interactive D3/Recharts/Three.js visualizations, live TensorFlow.js demos, sandboxed in-browser Python execution via Pyodide Web Workers, structured quizzes, and an optional server-proxied Groq AI tutor.

## 2. Folder Structure

```text
e:/quiz/
├── .github/workflows/ci.yml      # Lint, typecheck, unit test, code-verify, build, Pagefind, Playwright/axe, LHCI
├── .storybook/                   # Storybook configuration (Next.js + Vite + a11y + dark/light decorator)
├── content/
│   ├── modules.yaml              # Metadata & ordering for all 10 curriculum modules
│   ├── glossary.yaml             # Site-wide ML/AI glossary terms for hover-cards & /glossary
│   └── lessons/
│       ├── 01-foundations/       # 7 MDX lessons
│       ├── 02-classical-ml/      # 10 MDX lessons
│       ├── 03-deep-learning/     # 8 MDX lessons
│       ├── 04-computer-vision/   # 6 MDX lessons
│       ├── 05-nlp-transformers/  # 7 MDX lessons
│       ├── 06-generative-ai/     # 9 MDX lessons
│       ├── 07-reinforcement-learning/ # 6 MDX lessons
│       ├── 08-mlops/             # 6 MDX lessons
│       ├── 09-ai-safety/         # 6 MDX lessons
│       └── 10-capstones/         # 6 MDX lessons (playbook + 5 guided end-to-end projects)
├── prisma/
│   └── schema.prisma             # Optional Postgres sync (User, Progress, QuizAttempt, Note, Bookmark, Feedback)
├── public/
│   ├── datasets/                 # Small pinned CSV/JSON datasets for offline-safe Python & JS demos
│   ├── workers/pyodide.worker.js # Sandboxed WebAssembly Python Web Worker (no network access from user code)
│   ├── sw.js                     # Offline-capable PWA service worker
│   └── manifest.webmanifest      # PWA manifest
├── scripts/
│   ├── verify-code-examples.mjs  # CI script executing all MDX Python blocks + validating syntax/outputs
│   └── generate-cheatsheets.mjs  # Generates downloadable PDF cheatsheets per module into public/cheatsheets/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── progress/route.ts # Zod-validated progress sync (Postgres via Prisma when configured)
│   │   │   ├── tutor/route.ts    # Rate-limited, lesson-scoped Groq AI API proxy
│   │   │   ├── feedback/route.ts # Newsletter & lesson feedback route (Zod + rate limit)
│   │   │   └── og/route.tsx      # Dynamic OpenGraph image generator
│   │   ├── (marketing)/page.tsx  # Landing page with live hero neural net, path selector, roadmap
│   │   ├── curriculum/page.tsx   # Zoomable prerequisite graph + filterable module tree
│   │   ├── dashboard/page.tsx    # Resume, streaks, path progress rings, notes, bookmarks
│   │   ├── onboarding/page.tsx   # 30-second skippable path recommender
│   │   ├── learn/[module]/[slug]/page.tsx # Lesson reader (left module tree, center prose/demos, right TOC/AI)
│   │   ├── playgrounds/page.tsx  # Full-width distraction-free visualization & sandbox hub
│   │   ├── playgrounds/[viz]/page.tsx
│   │   ├── glossary/page.tsx
│   │   ├── cheatsheets/page.tsx
│   │   ├── search/page.tsx
│   │   ├── offline/page.tsx
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                   # Design system primitives (Button, Card, Slider, Tabs, Dialog, etc.) + *.stories.tsx
│   │   ├── mdx/                  # <Viz>, <CodeRunner>, <Quiz>, <Callout>, <Math>, <GlossaryTerm>, <KeyTakeaways>
│   │   ├── viz/                  # 11+ required interactive visualizations + static/screen-reader fallbacks
│   │   ├── layout/               # TopBar, ModuleSidebar, TableOfContents, CommandPalette, AiTutorDrawer, Footer
│   │   └── progress/             # ProgressProvider (localStorage + optional server sync), Onboarding, Badges
│   └── lib/
│       ├── content.ts            # Typed Velite re-exports & prerequisite graph helpers
│       ├── progress.ts           # Streak, badge, path completion, and URL-state codecs
│       ├── rate-limit.ts         # Sliding-window rate limiter for API routes
│       ├── analytics.ts          # Consent-aware privacy-first analytics wrapper
│       └── colab.ts              # Colab notebook URL/ipynb builder for heavy PyTorch labs
├── tests/
│   ├── unit/                     # Vitest + RTL unit/component tests
│   └── e2e/                      # Playwright functional, visual regression (3 viewports x 2 themes), and axe-core checks
├── DESIGN.md
├── PLAN.md
├── velite.config.ts
├── next.config.ts
├── Dockerfile
└── .lighthouserc.json
```

## 3. Data Models

### 3.1 Lesson Frontmatter Schema (`velite.config.ts`)
```ts
const lessonSchema = s.object({
  title: s.string().max(120),
  module: s.enum([
    'foundations', 'classical-ml', 'deep-learning', 'computer-vision',
    'nlp-transformers', 'generative-ai', 'reinforcement-learning',
    'mlops', 'ai-safety', 'capstones',
  ]),
  moduleOrder: s.number().int().min(1).max(10),
  order: s.number().int().min(1),
  level: s.enum(['beginner', 'practitioner', 'researcher']),
  paths: s.array(s.enum(['beginner', 'practitioner', 'researcher'])).min(1),
  estimatedMinutes: s.number().int().min(5).max(120),
  prerequisites: s.array(s.string()).default([]), // e.g. ["foundations/06-calculus-gradients"]
  objectives: s.array(s.string()).min(2).max(6),
  summary: s.string().max(280),
  tags: s.array(s.string()).default([]),
  vizTypes: s.array(s.string()).default([]),
  colabNotebook: s.string().optional(),
  hasScratchCode: s.boolean().default(true),
  hasLibraryCode: s.boolean().default(true),
  hasExercise: s.boolean().default(true),
  published: s.boolean().default(true),
  updatedAt: s.isodate(),
  slug: s.path(), // e.g. "lessons/02-classical-ml/02-gradient-descent"
  body: s.mdx(),
  toc: s.toc(),
  raw: s.raw(),
});
```

### 3.2 Client State & Optional Postgres Sync (`prisma/schema.prisma`)
- **localStorage (`neuralpath.state.v1`)**:
  - `activePath`: `'beginner' | 'practitioner' | 'researcher'`
  - `onboardingComplete`: `boolean`
  - `completedLessons`: `Record<string, { completedAt: string; quizScore: number; totalQuestions: number }>`
  - `bookmarks`: `string[]`
  - `notes`: `Record<string, string>`
  - `activityDates`: `string[]` (ISO dates for streak calculation)
  - `lastVisitedLesson`: `string | null`
  - `analyticsConsent`: `'pending' | 'granted' | 'denied'`
- **Prisma (`Postgres`)**: Mirrors progress, quiz attempts, notes, and bookmarks keyed by `userId` via optional NextAuth session. Gracefully disabled when `DATABASE_URL` is unset so local, static, and serverless deployments work out of the box.

## 4. Curriculum Map (10 Modules, 71 Lessons)
1. **Foundations (7):** What Is a Model?, Python for ML, NumPy Arrays & Broadcasting, Pandas & EDA, Linear Algebra Intuition, Calculus & Gradients, Probability & Information Theory.
2. **Classical ML (10):** Linear Regression, **Gradient Descent & Loss Surfaces**, Logistic Regression, Bias-Variance & Regularization, Cross-Validation & Metrics (ROC/PR), Feature Engineering, k-NN & SVM, Decision Trees, Random Forests & Gradient Boosting, k-Means & PCA.
3. **Deep Learning Core (8):** Perceptron to MLP, Activation Functions (ReLU/GELU/SwiGLU), Loss Functions, Backpropagation & Autodiff, Optimizers (SGD/Momentum/AdamW), Weight Initialization, BatchNorm/LayerNorm/RMSNorm, Dropout & Regularization.
4. **Computer Vision (6):** Convolutions & Kernels, CNN Architectures (LeNet to ResNet), Data Augmentation & Transfer Learning, Vision Transformers (ViT/DINOv2/SigLIP), Object Detection (YOLO/DETR), Segmentation (U-Net/SAM).
5. **Sequence Models & NLP (7):** Tokenization & BPE, Word Embeddings, RNN/LSTM/GRU, **Self-Attention (Q/K/V)**, Modern Transformer Architecture (RoPE/GQA/SwiGLU/MoE), BERT Encoders, GPT Decoders & KV Caching.
6. **Generative AI & LLMs (9):** Autoencoders & VAEs, GANs, Diffusion & Flow Matching (DDPM/Rectified Flow/DiT), Scaling Laws & MoE, Prompt Engineering & Structured Outputs, RAG & Agentic Retrieval, Fine-Tuning (LoRA/QLoRA), Agents & MCP Tool Use, LLM Evaluation (Ragas & LLM-as-a-Judge).
7. **Reinforcement Learning (6):** MDPs & Bellman Equations, Q-Learning & DQN, Policy Gradients (REINFORCE/A2C), PPO, RLHF / DPO / GRPO, Exploration & Multi-Armed Bandits.
8. **MLOps & Production (6):** Experiment Tracking, Model Serving (ONNX/vLLM), Quantization & Distillation (INT8/FP8/AWQ), Monitoring & Observability, Data & Concept Drift, CI/CD & Eval Gates for ML.
9. **AI Safety, Ethics & Interpretability (6):** Algorithmic Bias & Fairness, SHAP & LIME, Mechanistic Interpretability & Sparse Autoencoders, Adversarial Robustness & Red-Teaming, Alignment & Reward Hacking, Differential Privacy & Governance.
10. **Capstone Projects (6):** Capstone Engineering Playbook + 5 guided projects (Spam & Phishing Classifier, Custom Image Classifier, Mini-GPT Transformer, Grounded RAG Assistant, Autonomous RL Grid Agent).

