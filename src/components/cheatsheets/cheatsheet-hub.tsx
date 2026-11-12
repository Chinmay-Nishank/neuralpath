'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileDown,
  Copy,
  Check,
  Code2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Math } from '@/components/mdx/math';
import { cn } from '@/lib/utils';

export interface ModuleReferenceSheet {
  moduleId: string;
  order: number;
  shortTitle: string;
  title: string;
  tagline: string;
  formulas: Array<{
    name: string;
    tex: string;
    description: string;
  }>;
  codePattern: {
    title: string;
    description: string;
    code: string;
  };
  pitfalls: string[];
  firstLessonUrl: string;
}

export const MODULE_REFERENCES: ModuleReferenceSheet[] = [
  {
    moduleId: 'foundations',
    order: 1,
    shortTitle: 'Foundations',
    title: 'Mathematical Foundations & Vectorization',
    tagline: 'Matrix calculus, broadcasting, loss functions, and probability intuition from first principles.',
    formulas: [
      {
        name: 'Empirical Risk Minimization (MSE)',
        tex: 'L(\\theta) = \\frac{1}{N} \\sum_{i=1}^N \\left( y_i - f(x_i; \\theta) \\right)^2',
        description: 'Mean Squared Error measures average quadratic deviation between predictions and true labels.',
      },
      {
        name: 'Gradient Vector (Multivariable)',
        tex: '\\nabla_\\theta L = \\begin{bmatrix} \\frac{\\partial L}{\\partial \\theta_1} & \\frac{\\partial L}{\\partial \\theta_2} & \\cdots & \\frac{\\partial L}{\\partial \\theta_d} \\end{bmatrix}^T',
        description: 'Vector of partial derivatives pointing in the direction of steepest loss ascent.',
      },
      {
        name: 'Normal Equation (Analytical OLS)',
        tex: '\\theta^* = (X^T X)^{-1} X^T y',
        description: 'Closed-form exact global minimum solution for unregularized linear regression.',
      },
    ],
    codePattern: {
      title: 'Vectorized Linear Regression (Pure NumPy)',
      description: 'Zero-loop matrix computation of gradients and weights.',
      code: `import numpy as np

def compute_loss_and_grad(X: np.ndarray, y: np.ndarray, w: np.ndarray):
    # X: (N, D), y: (N, 1), w: (D, 1)
    N = X.shape[0]
    preds = X @ w
    loss = (1 / N) * np.sum((preds - y) ** 2)
    grad = (2 / N) * (X.T @ (preds - y))
    return loss, grad`,
    },
    pitfalls: [
      'Inverting singular or collinear matrices in (X^T X)^(-1); always regularize with small lambda*I.',
      'Forgetting bias term: prepend a column of ones np.c_[np.ones(N), X].',
      'Unintended broadcasting errors when subtracting 1D arrays from 2D column vectors.',
    ],
    firstLessonUrl: '/learn/foundations/01-what-is-a-model',
  },
  {
    moduleId: 'classical-ml',
    order: 2,
    shortTitle: 'Classical ML',
    title: 'Classical Machine Learning & Regularization',
    tagline: 'Gradient descent variants, logistic regression, tree ensembles, and cross-validation.',
    formulas: [
      {
        name: 'Gradient Descent Step',
        tex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta L(\\theta_t)',
        description: 'Iterative update adjusting parameters opposite to gradient direction with step size eta.',
      },
      {
        name: 'Binary Cross-Entropy (Log-Loss)',
        tex: 'L_{BCE} = -\\frac{1}{N} \\sum_{i=1}^N \\left[ y_i \\log \\hat{y}_i + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]',
        description: 'Negative log-likelihood loss for probabilistic binary classification.',
      },
      {
        name: 'Elastic Net Regularization',
        tex: 'L_{total} = L_{data} + \\lambda_1 \\|\\theta\\|_1 + \\frac{\\lambda_2}{2} \\|\\theta\\|_2^2',
        description: 'Combines L1 sparsity feature selection with L2 stability against correlated features.',
      },
    ],
    codePattern: {
      title: 'Logistic Regression with Stable Sigmoid',
      description: 'Numerically stable sigmoid preventing exp() overflow.',
      code: `import numpy as np

def stable_sigmoid(z: np.ndarray) -> np.ndarray:
    return np.where(z >= 0, 1 / (1 + np.exp(-z)), np.exp(z) / (1 + np.exp(z)))

def bce_loss(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-15) -> float:
    y_prob = np.clip(y_prob, eps, 1 - eps)
    return -np.mean(y_true * np.log(y_prob) + (1 - y_true) * np.log(1 - y_prob))`,
    },
    pitfalls: [
      'Fitting scalers (StandardScaler) on the whole dataset before splitting (severe data leakage).',
      'Using accuracy on heavily imbalanced datasets; always track PR-AUC or F1-score.',
      'Training gradient boosted trees with excessive depth causing rapid overfitting.',
    ],
    firstLessonUrl: '/learn/classical-ml/01-linear-regression',
  },
  {
    moduleId: 'deep-learning',
    order: 3,
    shortTitle: 'Deep Learning',
    title: 'Deep Learning Core & Optimization',
    tagline: 'Multilayer perceptrons, reverse-mode backpropagation, AdamW, and normalization.',
    formulas: [
      {
        name: 'Softmax Activation',
        tex: 'P(y = c \\mid z) = \\frac{e^{z_c}}{\\sum_{j=1}^C e^{z_j}}',
        description: 'Normalizes arbitrary unconstrained logits z into a valid categorical probability distribution.',
      },
      {
        name: 'Analytical Reverse-Mode Chain Rule',
        tex: '\\frac{\\partial L}{\\partial W^{[l]}} = \\delta^{[l]} \\cdot (a^{[l-1]})^T, \\quad \\delta^{[l]} = (W^{[l+1]})^T \\delta^{[l+1]} \\odot \\sigma\'(z^{[l]})',
        description: 'Backpropagates loss error vector delta backwards from output to input layers.',
      },
      {
        name: 'AdamW Weight-Decayed Optimizer',
        tex: '\\theta_{t+1} = \\theta_t - \\eta_t \\left( \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon} + \\lambda \\theta_t \\right)',
        description: 'Decouples L2 weight decay regularization from gradient magnitude moments.',
      },
    ],
    codePattern: {
      title: 'Minimal 2-Layer MLP Forward & Backward in PyTorch',
      description: 'Standard modern tensor forward and backward pass.',
      code: `import torch
import torch.nn as nn

class TwoLayerMLP(nn.Module):
    def __init__(self, in_features: int, hidden: int, out_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, hidden),
            nn.GELU(),
            nn.LayerNorm(hidden),
            nn.Linear(hidden, out_classes)
        )
    def forward(self, x):
        return self.net(x)`,
    },
    pitfalls: [
      'Zero-initializing weights: all neurons learn identical symmetric features; always use He/Xavier.',
      'Coupling L2 penalty inside Adam adaptive learning rates (use AdamW instead of Adam).',
      'Calling optimizer.step() without zeroing previous gradients (optimizer.zero_grad()).',
    ],
    firstLessonUrl: '/learn/deep-learning/01-perceptron-to-mlp',
  },
  {
    moduleId: 'computer-vision',
    order: 4,
    shortTitle: 'Computer Vision',
    title: 'Convolutional Networks & Vision Transformers',
    tagline: 'Spatial feature extraction, residual learning, transfer learning, and ViT patching.',
    formulas: [
      {
        name: '2D Convolution Output Dimension',
        tex: 'W_{out} = \\left\\lfloor \\frac{W_{in} - K + 2P}{S} \\right\\rfloor + 1',
        description: 'Computes spatial output width given kernel size K, padding P, and stride S.',
      },
      {
        name: 'Residual Identity Mapping',
        tex: 'y = \\mathcal{F}(x, \\{W_i\\}) + x',
        description: 'Skip connections allow gradients to flow unimpeded directly across hundreds of layers.',
      },
      {
        name: 'Vision Transformer (ViT) Patch Flattening',
        tex: 'z_0 = [x_{class}; x_p^1 E; x_p^2 E; \\dots; x_p^N E] + E_{pos}',
        description: 'Decomposes 2D images into 16x16 flattened vectors projected into 1D sequence tokens.',
      },
    ],
    codePattern: {
      title: 'Standard Residual Block (ResNet-style)',
      description: 'Convolution block with batch norm and skip shortcut.',
      code: `import torch.nn as nn

class ResBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(channels)
        )
        self.relu = nn.ReLU(inplace=True)
    def forward(self, x):
        return self.relu(x + self.conv(x))`,
    },
    pitfalls: [
      'Applying pooling too aggressively in early layers, losing fine spatial boundary details.',
      'Data augmentation applied after normalizing: augmentations must occur in native pixel space.',
      'ViTs require large pretraining datasets (JFT/ImageNet-21k) because they lack 2D inductive bias.',
    ],
    firstLessonUrl: '/learn/computer-vision/01-convolutions-kernels',
  },
  {
    moduleId: 'nlp-transformers',
    order: 5,
    shortTitle: 'Transformers & NLP',
    title: 'Sequence Models, Attention & Modern LLMs',
    tagline: 'Tokenization, Scaled Dot-Product Attention, RoPE, KV-caching, and autoregressive generation.',
    formulas: [
      {
        name: 'Scaled Dot-Product Attention',
        tex: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left( \\frac{Q K^T}{\\sqrt{d_k}} + M \\right) V',
        description: 'Computes query-key compatibility weights to produce dynamic value mixtures.',
      },
      {
        name: 'Rotary Position Embedding (RoPE)',
        tex: 'R_{\\Theta, m}^d = \\text{diag}\\left( R_{\\theta_1, m}, R_{\\theta_2, m}, \\dots, R_{\\theta_{d/2}, m} \\right)',
        description: 'Encodes relative token distances by rotating 2D query/key slices in the complex plane.',
      },
      {
        name: 'KV-Cache Memory Footprint',
        tex: '\\text{VRAM}_{KV} = 2 \\times 2 \\times L \\times H \\times D \\times S \\times B \\times \\text{bytes}',
        description: 'Calculates GPU memory required to hold precomputed key and value vectors.',
      },
    ],
    codePattern: {
      title: 'Vectorized Scaled Dot-Product Attention in PyTorch',
      description: 'Handles batches, multiple heads, and optional causal masking.',
      code: `import torch
import math

def scaled_dot_product_attention(Q, K, V, mask=None):
    # Q, K, V shape: (B, H, Seq, d_k)
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    weights = torch.softmax(scores, dim=-1)
    return torch.matmul(weights, V), weights`,
    },
    pitfalls: [
      'Omitting division by sqrt(d_k), causing large dot-product magnitudes and vanishing softmax gradients.',
      'Forgetting causal mask during autoregressive training, allowing tokens to cheat by looking ahead.',
      'Recomputing entire sequence KV states at every token during inference instead of using KV-caching.',
    ],
    firstLessonUrl: '/learn/nlp-transformers/01-tokenization-bpe',
  },
  {
    moduleId: 'generative-ai',
    order: 6,
    shortTitle: 'Generative AI',
    title: 'Generative Models, Diffusion & Flow Matching',
    tagline: 'VAEs, Flow Matching DiTs, RAG dense retrieval, and LoRA parameter-efficient adaptation.',
    formulas: [
      {
        name: 'Variational Evidence Lower Bound (ELBO)',
        tex: '\\log p(x) \\ge \\mathbb{E}_{q_\\phi(z|x)}[\\log p_\\theta(x|z)] - D_{KL}(q_\\phi(z|x) \\,\\|\\, p(z))',
        description: 'Balances data reconstruction fidelity against latent distribution regularization.',
      },
      {
        name: 'Flow Matching ODE Velocity Trajectory',
        tex: 'x_t = (1 - t) x_0 + t x_1, \\quad \\frac{d x_t}{d t} = v_t(x_t) = x_1 - x_0',
        description: 'Learns straight vector fields between Gaussian noise x_0 and real image data x_1.',
      },
      {
        name: 'LoRA Adapter Weight Update',
        tex: 'W = W_0 + \\frac{\\alpha}{r} B \\cdot A, \\quad B \\in \\mathbb{R}^{d \\times r}, A \\in \\mathbb{R}^{r \\times k}',
        description: 'Keeps base model frozen while training low-rank adapter projections (rank r << d).',
      },
    ],
    codePattern: {
      title: 'Minimal LoRA Linear Layer Implementation',
      description: 'Custom PyTorch module adding trainable low-rank adapters.',
      code: `import torch
import torch.nn as nn

class LoRALinear(nn.Module):
    def __init__(self, linear: nn.Linear, rank: int = 8, alpha: float = 16.0):
        super().__init__()
        self.base = linear
        self.base.weight.requires_grad = False
        self.scale = alpha / rank
        self.A = nn.Parameter(torch.randn(rank, linear.in_features) * 0.01)
        self.B = nn.Parameter(torch.zeros(linear.out_features, rank))
    def forward(self, x):
        return self.base(x) + self.scale * (x @ self.A.T @ self.B.T)`,
    },
    pitfalls: [
      'Inverting LoRA initialization: B must be initialized to 0 so adapter begins as an exact identity.',
      'Naïve chunking in RAG pipelines that splits sentences in half; use semantic or recursive splitters.',
      'Diffusion guidance scale (CFG) set too high, introducing harsh contrast clipping artifacts.',
    ],
    firstLessonUrl: '/learn/generative-ai/01-autoencoders-vae',
  },
  {
    moduleId: 'reinforcement-learning',
    order: 7,
    shortTitle: 'Reinforcement Learning',
    title: 'Reinforcement Learning & Post-Training Alignment',
    tagline: 'Markov Decision Processes, Bellman equations, PPO actor-critic, DPO, and GRPO.',
    formulas: [
      {
        name: 'Bellman Optimality Equation (Q*)',
        tex: 'Q^*(s, a) = R(s, a) + \\gamma \\sum_{s\'} P(s\' \\mid s, a) \\max_{a\'} Q^*(s\', a\')',
        description: 'Recursive fixed-point equation characterizing the globally optimal state-action value.',
      },
      {
        name: 'PPO Clipped Objective',
        tex: 'L^{CLIP}(\\theta) = \\hat{\\mathbb{E}}_t \\left[ \\min(r_t(\\theta) \\hat{A}_t, \\, \\text{clip}(r_t(\\theta), 1-\\epsilon, 1+\\epsilon) \\hat{A}_t) \\right]',
        description: 'Constrains policy step changes within a safe trust region to prevent policy degradation.',
      },
      {
        name: 'Direct Preference Optimization (DPO)',
        tex: 'L_{DPO} = -\\mathbb{E}_{(x, y_w, y_l)} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w|x)}{\\pi_{ref}(y_w|x)} - \\beta \\log \\frac{\\pi_\\theta(y_l|x)}{\\pi_{ref}(y_l|x)} \\right) \\right]',
        description: 'Optimizes LLM preferences directly from winner/loser pairs without training a separate reward model.',
      },
    ],
    codePattern: {
      title: 'PPO Policy Ratio Clipping in PyTorch',
      description: 'Calculates the surrogate objective with clipped trust region.',
      code: `import torch

def ppo_surrogate_loss(log_probs, old_log_probs, advantages, eps=0.2):
    # ratio = pi_theta(a|s) / pi_old(a|s)
    ratio = torch.exp(log_probs - old_log_probs)
    surr1 = ratio * advantages
    surr2 = torch.clamp(ratio, 1.0 - eps, 1.0 + eps) * advantages
    policy_loss = -torch.min(surr1, surr2).mean()
    return policy_loss`,
    },
    pitfalls: [
      'Unnormalized advantage estimates causing training instability; always standardize A = (A - mu) / sigma.',
      'Discount factor gamma set too close to 1 in infinite horizon tasks causing divergence.',
      'Over-optimizing reward models leading to sycophancy and reward hacking in RLHF pipelines.',
    ],
    firstLessonUrl: '/learn/reinforcement-learning/01-mdps-bellman',
  },
  {
    moduleId: 'mlops',
    order: 8,
    shortTitle: 'MLOps & Deployment',
    title: 'Production Serving, Quantization & Monitoring',
    tagline: 'ONNX export, INT8/INT4 quantization, continuous batching, and concept drift detection.',
    formulas: [
      {
        name: 'Uniform Affine Quantization',
        tex: 'q = \\text{clip}\\left( \\text{round}\\left( \\frac{x}{S} \\right) + Z, \\, q_{min}, \\, q_{max} \\right)',
        description: 'Maps continuous floating-point values into discrete integer grids with scale S and zero-point Z.',
      },
      {
        name: 'Affine Dequantization',
        tex: '\\hat{x} = S \\cdot (q - Z)',
        description: 'Recovers floating-point approximation from stored low-precision integers during compute.',
      },
      {
        name: 'Population Stability Index (PSI) Drift',
        tex: '\\text{PSI} = \\sum_{b=1}^B (P_b - Q_b) \\times \\ln\\left( \\frac{P_b}{Q_b} \\right)',
        description: 'Quantifies distribution shift between baseline reference P and production inference Q.',
      },
    ],
    codePattern: {
      title: 'Uniform Symmetric INT8 Quantizer',
      description: 'Fast symmetric quantization for hardware tensor core GEMM.',
      code: `import numpy as np

def quantize_symmetric(w: np.ndarray):
    alpha = np.max(np.abs(w))
    scale = alpha / 127.0
    q = np.clip(np.round(w / (scale + 1e-12)), -127, 127).astype(np.int8)
    return q, scale

def dequantize_symmetric(q: np.ndarray, scale: float):
    return q.astype(np.float32) * scale`,
    },
    pitfalls: [
      'Serving LLMs with static batching, causing severe GPU idle times while waiting for the longest prompt.',
      'Quantizing outlier activations uniformly without per-channel or activation-aware scaling (AWQ).',
      'Relying on mean inference latency instead of P99 tail metrics when budgeting user SLAs.',
    ],
    firstLessonUrl: '/learn/mlops/01-experiment-tracking',
  },
  {
    moduleId: 'ai-safety',
    order: 9,
    shortTitle: 'Safety & Interpretability',
    title: 'Fairness, Mechanistic Interpretability & Alignment',
    tagline: 'Disparate impact, Sparse Autoencoders, activation patching, and steering vectors.',
    formulas: [
      {
        name: 'Disparate Impact Ratio (Fairness)',
        tex: '\\text{DIR} = \\frac{P(\\hat{Y} = 1 \\mid D = \\text{unprivileged})}{P(\\hat{Y} = 1 \\mid D = \\text{privileged})}',
        description: 'Four-fifths rule (80% benchmark) measuring disparate adverse impact across demographic groups.',
      },
      {
        name: 'Sparse Autoencoder (SAE) Monosemantic Objective',
        tex: 'L_{SAE} = \\|x - \\hat{x}\\|_2^2 + \\lambda \\sum_{i=1}^M |f_i|, \\quad f = \\text{ReLU}(W_{enc} x + b_{enc})',
        description: 'Disentangles polysemantic superposed representations into interpretable sparse latent directions.',
      },
      {
        name: 'Residual Stream Steering Vector',
        tex: 'x_{steered} = x + \\alpha \\cdot \\vec{v}_{concept}, \\quad \\vec{v} = \\mu_{pos} - \\mu_{neg}',
        description: 'Directly guides model behavior at runtime without modifying or fine-tuning weights.',
      },
    ],
    codePattern: {
      title: 'Activation Steering Vector Injection in PyTorch',
      description: 'Applies concept steering during forward pass hooks.',
      code: `import torch

def apply_steering_hook(module, input_tensor, output_tensor, steering_vector, alpha=2.0):
    # output_tensor shape: (B, Seq, Hidden)
    if isinstance(output_tensor, tuple):
        hidden = output_tensor[0]
        steered = hidden + alpha * steering_vector
        return (steered,) + output_tensor[1:]
    return output_tensor + alpha * steering_vector`,
    },
    pitfalls: [
      'Assuming that a model with high test accuracy is inherently unbiased or safe.',
      'Relying purely on output prompt guards rather than mechanistic internal circuit verification.',
      'Excessive steering magnitude causing model coherence collapse and repetitive loops.',
    ],
    firstLessonUrl: '/learn/ai-safety/01-bias-fairness',
  },
  {
    moduleId: 'capstones',
    order: 10,
    shortTitle: 'Capstones',
    title: 'Capstone Projects & End-to-End Systems',
    tagline: '5 guided portfolio projects: Spam Classifier, CNNs, Mini-GPT, RAG Assistant, and RL Grid Agent.',
    formulas: [
      {
        name: 'Cross-Entropy with Label Smoothing',
        tex: 'L_{smooth} = (1 - \\epsilon) L_{CE} + \\frac{\\epsilon}{C} \\sum_{c=1}^C -\\log \\hat{y}_c',
        description: 'Regularizes overconfident predictions on real-world noisy production datasets.',
      },
      {
        name: 'BLEU Precision Geometric Mean',
        tex: '\\text{BLEU} = \\text{BP} \\times \\exp\\left( \\sum_{n=1}^N w_n \\ln p_n \\right)',
        description: 'Measures n-gram overlap between generated text and reference human annotations.',
      },
      {
        name: 'Mean Reciprocal Rank (MRR)',
        tex: '\\text{MRR} = \\frac{1}{|Q|} \\sum_{i=1}^{|Q|} \\frac{1}{\\text{rank}_i}',
        description: 'Evaluates top-ranked relevance quality for information retrieval and RAG systems.',
      },
    ],
    codePattern: {
      title: 'Production Deterministic Evaluation Harness',
      description: 'Standardized evaluation with pinned seeds and metrics logging.',
      code: `import torch
import random
import numpy as np

def set_deterministic_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True`,
    },
    pitfalls: [
      'Jumping into deep architectures without benchmarking a simple heuristic baseline first.',
      'Training on un-shuffled sequential data causing severe catastrophic batch correlation.',
      'Failing to isolate and ablate individual model components in final engineering reports.',
    ],
    firstLessonUrl: '/learn/capstones/01-capstone-playbook',
  },
];

export function CheatsheetHub() {
  const [selectedModuleId, setSelectedModuleId] = React.useState<string>('all');
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopyCode = async (key: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Non-blocking fallback
    }
  };

  const displayedReferences = React.useMemo(() => {
    if (selectedModuleId === 'all') return MODULE_REFERENCES;
    return MODULE_REFERENCES.filter((m) => m.moduleId === selectedModuleId);
  }, [selectedModuleId]);

  return (
    <div className="space-y-10 w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Module Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-hairline bg-surface p-2 shadow-sm min-w-0">
        <button
          type="button"
          onClick={() => setSelectedModuleId('all')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all min-h-[36px]',
            selectedModuleId === 'all'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-primary-secondary hover:text-primary hover:bg-subtle'
          )}
        >
          All 10 Modules
        </button>
        {MODULE_REFERENCES.map((mod) => (
          <button
            key={mod.moduleId}
            type="button"
            onClick={() => setSelectedModuleId(mod.moduleId)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all min-h-[36px]',
              selectedModuleId === mod.moduleId
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-primary-secondary hover:text-primary hover:bg-subtle'
            )}
          >
            M{mod.order}. {mod.shortTitle}
          </button>
        ))}
      </div>

      {/* Reference Cards */}
      <div className="space-y-10 min-w-0">
        {displayedReferences.map((ref) => {
          const pdfHref = `/cheatsheets/${ref.moduleId}.pdf`;
          return (
            <section
              key={ref.moduleId}
              id={ref.moduleId}
              className="rounded-xl border border-hairline bg-surface p-4 sm:p-6 shadow-sm space-y-6 min-w-0 max-w-full overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4 min-w-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent shrink-0">
                      Module {String(ref.order).padStart(2, '0')}
                    </span>
                    <Badge variant="neutral" className="break-words">Formula &amp; Implementation Reference</Badge>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-primary sm:text-2xl break-words">
                    {ref.title}
                  </h2>
                  <p className="text-xs text-primary-secondary sm:text-sm break-words">{ref.tagline}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={pdfHref}
                    download={`${ref.moduleId}-cheatsheet.pdf`}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'min-h-[36px]'
                    )}
                  >
                    <FileDown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    <span>Download PDF</span>
                  </a>
                  <Link
                    href={ref.firstLessonUrl}
                    className={cn(
                      buttonVariants({ variant: 'primary', size: 'sm' }),
                      'min-h-[36px]'
                    )}
                  >
                    <span>Start Module</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Core Mathematical Formulas */}
              <div className="space-y-3 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Core Mathematical Formulas</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
                  {ref.formulas.map((f, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex flex-col justify-between rounded-lg border border-hairline bg-canvas p-4 min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-primary break-words">{f.name}</h3>
                        <div className="my-2 max-w-full text-center py-1">
                          <Math display tex={f.tex} />
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed text-primary-secondary border-t border-hairline pt-2 break-words">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Python Implementation Pattern */}
              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                    <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Reference Python Implementation</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCode(ref.moduleId, ref.codePattern.code)}
                    className="h-8 text-xs text-primary-muted hover:text-primary shrink-0"
                  >
                    {copiedKey === ref.moduleId ? (
                      <>
                        <Check className="h-3 w-3 text-success mr-1" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg border border-hairline bg-canvas p-3 font-mono text-xs min-w-0 max-w-full overflow-hidden">
                  <div className="mb-2 text-[11px] font-sans text-primary-secondary break-words">
                    <span className="font-semibold text-primary">{ref.codePattern.title}:</span>{' '}
                    {ref.codePattern.description}
                  </div>
                  <pre
                    tabIndex={0}
                    role="region"
                    aria-label={`${ref.codePattern.title} code snippet`}
                    className="max-w-full overflow-x-auto p-2 text-[11px] leading-relaxed text-primary focus:outline-none focus:ring-1 focus:ring-accent rounded-sm"
                  >
                    <code>{ref.codePattern.code}</code>
                  </pre>
                </div>
              </div>

              {/* Critical Gotchas & Failure Modes */}
              <div className="space-y-2 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-warning">
                  Critical Gotchas &amp; Common Failure Modes
                </div>
                <ul className="grid gap-2 sm:grid-cols-3 text-xs text-primary-secondary min-w-0">
                  {ref.pitfalls.map((pitfall, pIdx) => (
                    <li
                      key={pIdx}
                      className="rounded-lg border border-hairline bg-subtle/40 p-3 leading-relaxed min-w-0 break-words"
                    >
                      <span className="font-semibold text-primary">Avoid:</span> {pitfall}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
