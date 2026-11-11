import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'cheatsheets');

const MODULE_NOTES = {
  foundations: [
    'Model: y_hat = f(x; theta), trained to minimize empirical loss L(theta).',
    'Vectorization: prefer NumPy matrix operations (X @ W + b) over Python loops.',
    'Linear Algebra: dot product u.v = ||u|| ||v|| cos(theta); SVD factors M = U Sigma V^T.',
    'Calculus: gradient points uphill; chain rule propagates partial derivatives backward.',
    'Information Theory: Cross-Entropy H(p, q) = -sum p(x) log q(x) = H(p) + KL(p || q).',
  ],
  'classical-ml': [
    'Always split train/validation/test BEFORE fitting scalers, encoders, or PCA (no leakage).',
    'Gradient Descent: theta <- theta - eta * grad(L). Scale features to fix ravine conditioning.',
    'Bias-Variance: Ridge (L2) shrinks weights smoothly; Lasso (L1) drives sparse weights to zero.',
    'Metrics: use PR-AUC and F1 under severe class imbalance; inspect calibration and confusion matrix.',
    'Ensembles: Random Forests reduce variance via bagging; Gradient Boosting reduces bias sequentially.',
  ],
  'deep-learning': [
    'Backpropagation computes exact gradients for every weight in one reverse pass.',
    'Modern Activations: ReLU for CNNs, GELU or SwiGLU for Transformers.',
    'Init: Kaiming/He for ReLU; Xavier/Glorot for symmetric Tanh/Sigmoid.',
    'Normalization: LayerNorm or RMSNorm stabilizes deep residual stacks independent of batch size.',
    'Optimizer default: AdamW (decoupled weight decay) with cosine learning-rate warmup + decay.',
  ],
  'computer-vision': [
    'Conv2D output size: floor((H + 2p - k) / s) + 1.',
    'ResNet skip connections y = F(x) + x eliminate vanishing gradients in deep networks.',
    'Transfer Learning: freeze early edge/texture layers; fine-tune top blocks with lower LR.',
    'ViT splits images into fixed patches + positional embeddings and applies self-attention.',
    'Detection/Segmentation: YOLO/DETR for bounding boxes; U-Net and SAM for dense pixel masks.',
  ],
  'nlp-transformers': [
    'BPE merges frequent adjacent character/byte pairs into compact subword vocabularies.',
    'Self-Attention: softmax((Q K^T) / sqrt(d_k) + M) V. Scale by sqrt(d_k) to prevent saturation.',
    'Modern Transformer: Pre-RMSNorm, RoPE positional rotations, GQA KV-cache sharing, SwiGLU.',
    'BERT uses bidirectional masked language modeling; GPT uses causal masking + KV caching.',
  ],
  'generative-ai': [
    'VAE maximizes ELBO = Reconstruction - KL(q(z|x) || p(z)).',
    'Flow Matching & DiT learn straight velocity fields from noise to data in 4-20 NFE steps.',
    'RAG: hybrid search (dense + BM25) + reranker + Ragas triad (Faithfulness, Relevance, Recall).',
    'LoRA/QLoRA: freeze W_0 (4-bit NF4), learn low-rank delta W = B * A.',
    'Agents & MCP: expose external tools behind scoped, audited JSON-RPC MCP servers.',
  ],
  'reinforcement-learning': [
    'MDP: (S, A, P, R, gamma). Bellman optimality connects V*(s) and Q*(s,a).',
    'Q-Learning: Q(s,a) <- Q(s,a) + alpha [r + gamma max Q(s\', a\') - Q(s,a)].',
    'PPO clips policy probability ratios within [1-eps, 1+eps] for stable updates.',
    'Post-training Alignment: DPO optimizes preference pairs directly; GRPO drops the critic network.',
  ],
  mlops: [
    'Track code SHA, data snapshot hash, hyperparameters, and random seeds per run.',
    'Serving: ONNX Runtime for classical/vision; vLLM continuous batching + PagedAttention for LLMs.',
    'Quantization: INT8 / FP8 / AWQ 4-bit cut VRAM 2x-4x with minimal perplexity shift.',
    'Monitor latency P99, PSI/KS feature drift, and automated golden-suite regression gates.',
  ],
  'ai-safety': [
    'Fairness trade-offs: Demographic Parity vs. Equalized Odds vs. Calibration.',
    'SHAP computes unique game-theoretic additive feature attributions summing to f(x) - E[f(x)].',
    'Mechanistic Interpretability: Sparse Autoencoders (SAEs) isolate monosemantic features.',
    'Defend agents against indirect prompt injection with least-privilege tool allowlists & HITL.',
  ],
  capstones: [
    'Start with a deterministic baseline and clean train/val split before tuning architectures.',
    'Error analysis: inspect top-20 worst validation errors before changing model complexity.',
    'Pin dependencies, bundle validation datasets, and gate releases on reproducible eval suites.',
  ],
};

async function buildPdf(mod) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  let y = 740;
  page.drawText('NEURALPATH CHEATSHEET', {
    x: 48,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.11, 0.31, 0.85),
  });
  y -= 24;
  page.drawText(`Module ${mod.order}: ${mod.title}`, {
    x: 48,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.08, 0.09, 0.12),
  });
  y -= 20;
  page.drawText(mod.description.slice(0, 95), {
    x: 48,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.34, 0.4),
  });
  y -= 16;
  page.drawLine({
    start: { x: 48, y },
    end: { x: 564, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  y -= 28;
  page.drawText('Core Formulas, Mental Models & Engineering Rules', {
    x: 48,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.08, 0.09, 0.12),
  });
  y -= 22;

  const bullets = MODULE_NOTES[mod.id] ?? [mod.description];
  for (const line of bullets) {
    page.drawText(`• ${line}`, {
      x: 54,
      y,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.15, 0.17, 0.22),
      maxWidth: 500,
    });
    y -= 30;
  }

  y -= 14;
  page.drawText(`Estimated study time: ${mod.estimatedHours} hours · Badge: ${mod.badgeTitle}`, {
    x: 48,
    y,
    size: 9.5,
    font: fontMono,
    color: rgb(0.35, 0.4, 0.48),
  });

  page.drawText('Generated by NeuralPath Open Curriculum', {
    x: 48,
    y: 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.45, 0.48, 0.55),
  });

  return doc.save();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const modulesRaw = fs.readFileSync(path.join(ROOT, 'content', 'modules.yaml'), 'utf8');
  const modules = yaml.load(modulesRaw);
  for (const mod of modules) {
    const bytes = await buildPdf(mod);
    fs.writeFileSync(path.join(OUT_DIR, `${mod.id}.pdf`), bytes);
  }
  console.log(`Generated ${modules.length} module PDF cheatsheets in public/cheatsheets/.`);
}

main();

