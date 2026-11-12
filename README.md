# NeuralPath

**NeuralPath** is an open-source interactive Machine Learning, Deep Learning, and AI learning platform designed to take a learner with basic programming knowledge from *"what is a model?"* to training and deploying modern Transformers, RAG systems, RL agents, and production ML pipelines.

## Highlights
- **71 Structured MDX Lessons Across 10 Modules:** Foundations, Classical ML, Deep Learning Core, Computer Vision, Sequence Models & Transformers, Generative AI (Flow Matching, DiT, RAG, LoRA, MCP, Eval), Reinforcement Learning (MDP, Q-Learning, PPO, DPO, GRPO), MLOps, AI Safety & Mechanistic Interpretability (SAEs), and 5 guided Capstones.
- **5 Guided Specialization Pathways (Scratch to Advanced):** Zero to Hero (Complete AI Journey), Generative AI & LLMs, Computer Vision & Multimodal, RL & Post-Training Alignment, and Production MLOps with automated progress tracking and milestone badges.
- **Diagnostic Placement & Skill Assessment (`/placement`):** 10-tier diagnostic quiz assessing mathematical foundations, classical ML, deep learning, attention mechanisms, and modern alignment with instant feedback and tailored pathway recommendations.
- **From-Scratch ML Algorithms Lab (`/lab`):** Step-by-step implementations in pure Python & NumPy with zero black-box libraries: Vectorized Linear Regression, Logistic Regression BCE, 35-line Micro-Autograd Engine, 2-Layer MLP with Analytical Backprop, Scaled Dot-Product Attention, and BPE Tokenizer.
- **Interactive 3D & 2D Visualizations:** 3D Gradient Descent Loss Surfaces, 3D Neural Network & Probability Manifold, 3D Self-Attention (Q, K, V) Skyline, 3D Embedding Space (PCA/t-SNE/UMAP), Decision Boundary Playground, Backprop Graph, Convolution Explorer, BPE Tokenizer, Bias-Variance Demo, Diffusion vs. Flow Matching, and RL GridWorld.
- **Spaced Repetition & Cognitive Science Tools:** Pure FSRS Spaced Repetition (`/review`), Interleaved Mixed Practice (`/practice`), Feynman Teach-Back draft studio, and a calm Focus Study Timer.
- **Curriculum + Google Web Search:** Instant Ctrl+K Pagefind full-text curriculum search paired with targeted Google Web Search (ArXiv, PyTorch Docs, scikit-learn, Papers With Code) without needing any third-party LLM keys.
- **Sandboxed In-Browser Python (`Pyodide`):** Edit and run NumPy, pandas, and scikit-learn directly in a network-isolated Web Worker (`public/workers/pyodide.worker.js`), plus one-click `.ipynb` / Open in Colab for PyTorch examples.
- **Zero-Setup Local Progress + Optional Cloud Sync:** Tracks streaks, quiz scores, FSRS cards, bookmarks, and lesson notes in `localStorage` with JSON export/restore, plus optional NextAuth + PostgreSQL sync via Prisma.

## Architecture

```text
Browser (Next.js 15 App Router + React 19)
 ├── Static SSG Lesson Pages ◄── Velite MDX Compiler (content/lessons/**/*.mdx)
 ├── From-Scratch ML Lab     ◄── Pure Python / NumPy Algorithms + Live Pyodide Sandbox
 ├── Diagnostic Placement    ◄── Multi-Tier Skill Assessment + Adaptive Recommendations
 ├── Dynamic 3D/2D <Viz />    ◄── Three.js / D3 / TensorFlow.js / Canvas
 ├── <CodeRunner />           ◄── Lazy Monaco Editor ──► Sandboxed Pyodide Web Worker
 ├── Cmd+K & /search          ◄── Pagefind Static Index + Targeted Google Web Search
 ├── /review & /practice      ◄── FSRS Spaced Repetition + Cross-Module Interleaving
 └── Progress & Notes         ◄── localStorage ──(optional)──► /api/progress ──► Postgres (Prisma)
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
   All optional services (`DATABASE_URL`, `AUTH_GITHUB_*`) degrade gracefully when omitted—no API keys are required to build or run the site.
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

## Docker Deployment
```bash
docker build -t neuralpath .
docker run -p 3000:3000 neuralpath
```

Or launch cleanly with Docker Compose:
```bash
docker compose up --build
```

## Vercel / Node Deployment
- Uses [`vercel.json`](vercel.json) and `postinstall` (`prisma generate`) so a fresh `npm ci && npm run build` works automatically on Vercel, Railway, or Render without manual steps or external API keys.
- Optionally set `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, and `AUTH_GITHUB_*` in your hosting environment variables; all optional integrations degrade gracefully when unset.
- Health check endpoint: `GET /api/health` returns `{ ok: true, status: "healthy", lessons, cards, searchEngine: "google" }`.
