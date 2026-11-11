# NeuralPath

**NeuralPath** is an open-source interactive Machine Learning, Deep Learning, and AI learning platform designed to take a learner with basic programming knowledge from *"what is a model?"* to training and deploying modern Transformers, RAG assistants, RL agents, and production ML pipelines.

## Highlights
- **71 Structured MDX Lessons Across 10 Modules:** Foundations, Classical ML, Deep Learning Core, Computer Vision, Sequence Models & Transformers, Generative AI (Flow Matching, DiT, RAG, LoRA, MCP, Eval), Reinforcement Learning (MDP, Q-Learning, PPO, DPO, GRPO), MLOps, AI Safety & Mechanistic Interpretability (SAEs), and 5 guided Capstones.
- **11+ Interactive Visualizations:** Gradient Descent 2D/3D Surface, Decision Boundary Playground, TensorFlow.js Neural Network Playground, Backprop Computational Graph, Convolution Explorer (with custom image upload), Self-Attention Q/K/V Explorer, 3D Embedding Space (PCA/t-SNE/UMAP), BPE Tokenizer, Bias-Variance Slider, Diffusion vs. Flow Matching, and RL GridWorld.
- **Sandboxed In-Browser Python (`Pyodide`):** Edit and run NumPy, pandas, and scikit-learn directly in a network-isolated Web Worker (`public/workers/pyodide.worker.js`), plus one-click `.ipynb` / Open in Colab for PyTorch examples.
- **Zero-Setup Local Progress + Optional Cloud Sync:** Tracks streaks, quiz scores, bookmarks, and lesson notes in `localStorage`, with optional NextAuth + PostgreSQL sync via Prisma.
- **Production Hardened:** Self-hosted variable fonts, Pagefind static full-text search, dynamic OpenGraph images, PDF cheatsheets per module, CSP headers, rate-limited Groq AI Tutor route, Storybook design system, Vitest, Playwright + axe-core, and Lighthouse CI.

## Architecture

```text
Browser (Next.js 15 App Router + React 19)
 ├── Static SSG Lesson Pages ◄── Velite MDX Compiler (content/lessons/**/*.mdx)
 ├── Dynamic Split <Viz />    ◄── Three.js / D3 / TensorFlow.js / Canvas
 ├── <CodeRunner />           ◄── Lazy Monaco Editor ──► Sandboxed Pyodide Web Worker
 ├── Cmd+K Search             ◄── Pagefind Static Index (prod) / Velite Metadata (dev)
 ├── Progress & Notes         ◄── localStorage ──(optional)──► /api/progress ──► Postgres (Prisma)
 └── AI Tutor Sidebar         ◄── /api/tutor (Rate Limit + Zod) ──► Groq API (openai/gpt-oss-120b)
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   npx prisma generate
   ```
2. **Configure optional environment variables**
   ```bash
   cp .env.example .env.local
   ```
   All optional services (`GROQ_API_KEY`, `DATABASE_URL`, `AUTH_GITHUB_*`) degrade gracefully when unset.
3. **Generate module PDF cheatsheets & run dev server**
   ```bash
   npm run generate:cheatsheets
   npm run dev
   ```
4. **Verify all code blocks, unit tests, lint, types, and production build**
   ```bash
   npm run verify:code
   npm test
   npm run lint
   npm run typecheck
   npm run build
   ```

## Storybook Design System
```bash
npm run storybook
```

## Docker Deployment
```bash
docker build -t neuralpath .
docker run -p 3000:3000 --env-file .env.local neuralpath
```

