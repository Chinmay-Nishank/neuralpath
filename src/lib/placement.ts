export interface PlacementQuestion {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  tierLabel: string;
  question: string;
  options: Array<{
    text: string;
    explanation: string;
  }>;
  correctIndex: number;
}

export interface PlacementResult {
  score: number;
  total: number;
  level: 'beginner' | 'practitioner' | 'researcher';
  title: string;
  summary: string;
  recommendedPathwayId: string;
  recommendedStartUrl: string;
  recommendedModuleTitle: string;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'math-dot-product',
    tier: 1,
    tierLabel: 'Foundations (From Scratch)',
    question: 'Geometrically, what does it mean if the dot product u · v of two non-zero vectors is zero?',
    options: [
      {
        text: 'The vectors point in exactly the same direction.',
        explanation: 'If u · v = ||u|| ||v||, the vectors are parallel, not perpendicular.',
      },
      {
        text: 'The vectors are orthogonal (perpendicular) at a 90° angle.',
        explanation: 'u · v = ||u|| ||v|| cos(90°) = 0, indicating absolute orthogonality.',
      },
      {
        text: 'One of the vectors must contain all zeros.',
        explanation: 'The question specifically specified two non-zero vectors.',
      },
      {
        text: 'The vectors lie along opposite axes in reverse direction.',
        explanation: 'Opposite vectors yield a negative dot product: u · v = -||u|| ||v||.',
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'math-gradient-descent',
    tier: 1,
    tierLabel: 'Foundations (From Scratch)',
    question: 'In standard Gradient Descent w_new = w - α ∇L(w), what does the negative sign ensure?',
    options: [
      {
        text: 'The update steps in the direction of steepest descent, reducing the loss.',
        explanation: 'The gradient vector points in the direction of greatest increase; subtracting it steps downhill.',
      },
      {
        text: 'The learning rate α stays strictly positive.',
        explanation: 'The sign modifies the gradient direction, not the scalar value of α.',
      },
      {
        text: 'The parameter values are constrained between -1 and +1.',
        explanation: 'Weights are unconstrained unless an explicit bounding or clipping operation is applied.',
      },
      {
        text: 'The loss function becomes convex even if non-convex.',
        explanation: 'The gradient operator does not alter the underlying surface topology.',
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'cml-overfitting',
    tier: 2,
    tierLabel: 'Classical Machine Learning',
    question: 'During training, your training loss decreases to near-zero, but your validation loss begins climbing steeply. What is happening?',
    options: [
      {
        text: 'Underfitting due to an overly simplistic linear hypothesis.',
        explanation: 'Underfitting results in high training loss and high validation loss.',
      },
      {
        text: 'Overfitting: the model is memorizing training noise rather than generalizable patterns.',
        explanation: 'Divergence between falling train loss and rising validation loss is the hallmark of overfitting.',
      },
      {
        text: 'Vanishing gradients preventing weight updates.',
        explanation: 'Vanishing gradients stall training early, preventing training loss from reaching zero.',
      },
      {
        text: 'The learning rate is too small to reach convergence.',
        explanation: 'A small learning rate results in slow training, not rising validation loss.',
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'dl-activations',
    tier: 2,
    tierLabel: 'Deep Learning Core',
    question: 'Why does ReLU (f(x) = max(0, x)) effectively prevent vanishing gradients during backprop compared to Sigmoid?',
    options: [
      {
        text: 'Its derivative is exactly 1 for all positive inputs, preventing exponential gradient decay.',
        explanation: 'For x > 0, d/dx ReLU = 1. Sigmoid maximum derivative is only 0.25, causing rapid attenuation across deep layers.',
      },
      {
        text: 'ReLU normalizes outputs strictly between 0 and 1.',
        explanation: 'ReLU is unbounded for positive inputs: [0, ∞). Sigmoid maps to (0, 1).',
      },
      {
        text: 'ReLU is twice continuously differentiable everywhere.',
        explanation: 'ReLU is non-differentiable at exactly x = 0 (subgradient convention applies).',
      },
      {
        text: 'ReLU eliminates the need for matrix multiplications in linear layers.',
        explanation: 'Activations follow linear transformations (W x + b); they do not replace them.',
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'dl-backpropagation',
    tier: 3,
    tierLabel: 'Deep Learning Core',
    question: 'Why is reverse-mode automatic differentiation (backpropagation) used instead of forward-mode for neural networks?',
    options: [
      {
        text: 'It computes gradients of a single scalar loss with respect to millions of weights in one backward pass.',
        explanation: 'Reverse-mode cost scales with the number of outputs (1 scalar loss), whereas forward-mode scales with the number of inputs/weights.',
      },
      {
        text: 'Reverse-mode does not require storing intermediate activations during forward pass.',
        explanation: 'Reverse-mode explicitly requires storing forward activations in memory (activation caching).',
      },
      {
        text: 'Forward-mode cannot compute derivatives of non-linear functions.',
        explanation: 'Forward-mode can compute derivatives of any differentiable function; it is just computationally inefficient for N >> 1 weights.',
      },
      {
        text: 'Reverse-mode guarantees convergence to the global optimum.',
        explanation: 'Optimization convergence depends on the loss landscape and optimizer, not the autodiff mode.',
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'transformers-scaled-attention',
    tier: 3,
    tierLabel: 'Sequence Models & Transformers',
    question: 'In Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V, what is the mathematical purpose of dividing by sqrt(d_k)?',
    options: [
      {
        text: 'To convert queries and keys into probabilities summing to 1.',
        explanation: 'The softmax function normalizes scores into probabilities, not the scalar divisor sqrt(d_k).',
      },
      {
        text: 'To prevent dot products from growing excessively large, which pushes softmax into regions with vanishingly small gradients.',
        explanation: 'For large d_k, the dot products grow in variance by O(d_k). Dividing by sqrt(d_k) preserves unit variance and healthy softmax gradients.',
      },
      {
        text: 'To ensure the output tensor matches the dimensions of V.',
        explanation: 'The output dimension is determined by matrix multiplication with V, not scaling.',
      },
      {
        text: 'To enforce causal masking for autoregressive decoders.',
        explanation: 'Causal masking is applied by adding -inf to upper-triangular logits before softmax.',
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'transformers-causal-masking',
    tier: 4,
    tierLabel: 'Sequence Models & Transformers',
    question: 'In autoregressive decoder transformers (like GPT), how is information from future token positions prevented from leaking into earlier tokens?',
    options: [
      {
        text: 'By training separate models for each token position.',
        explanation: 'GPT uses a single shared autoregressive model across all token positions.',
      },
      {
        text: 'By adding an upper-triangular mask of -infinity to attention logits before computing the softmax.',
        explanation: 'Setting upper-triangular elements to -inf causes softmax to produce exact 0 attention weight for all future positions.',
      },
      {
        text: 'By omitting positional encodings altogether.',
        explanation: 'Without positional encodings, attention is permutation-invariant and ignores token ordering.',
      },
      {
        text: 'By stopping gradient flow through the feedforward layers.',
        explanation: 'Causal masking happens directly inside the self-attention score matrix.',
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'genai-lora',
    tier: 4,
    tierLabel: 'Generative AI & Modern LLMs',
    question: 'How does Low-Rank Adaptation (LoRA) enable parameter-efficient fine-tuning of 70B+ LLMs?',
    options: [
      {
        text: 'It quantizes all weights to 1-bit integers without updating any values.',
        explanation: 'Quantization reduces bit-width, whereas LoRA learns low-rank residual adapters.',
      },
      {
        text: 'It freezes base weights W0 and decomposes the weight update into two low-rank matrices ΔW = B · A where r << min(d, k).',
        explanation: 'By setting rank r (e.g., 8 or 16), trainable parameters drop by >99% while preserving full-rank representational capacity.',
      },
      {
        text: 'It deletes all attention layers and trains only the final vocabulary projection.',
        explanation: 'LoRA typically adapts attention weight matrices (W_q, W_v) and MLP layers.',
      },
      {
        text: 'It retrains only the tokenizer vocabulary embeddings.',
        explanation: 'LoRA adapts hidden linear transformations, not just token embeddings.',
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'rl-dpo',
    tier: 5,
    tierLabel: 'Reinforcement Learning & Alignment',
    question: 'What is the primary breakthrough of Direct Preference Optimization (DPO) over classic RLHF with PPO?',
    options: [
      {
        text: 'DPO requires zero human-labeled preference pairs.',
        explanation: 'DPO still requires preference pairs (y_w > y_l), but avoids separate reward model training.',
      },
      {
        text: 'DPO reparameterizes the reward function analytically into closed-form policy probabilities, training directly via binary cross-entropy without an explicit reward model or RL loop.',
        explanation: 'DPO derives that r(x,y) = β log(π_θ(y|x) / π_ref(y|x)), turning complex RL into a stable supervised preference loss.',
      },
      {
        text: 'DPO replaces the transformer decoder with a continuous actor-critic network.',
        explanation: 'DPO operates directly on standard transformer decoder token probabilities.',
      },
      {
        text: 'DPO eliminates the need for a reference policy π_ref.',
        explanation: 'DPO explicitly uses the reference policy π_ref to prevent the policy from collapsing.',
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'mlops-quantization',
    tier: 5,
    tierLabel: 'MLOps & High-Throughput Serving',
    question: 'When serving modern LLMs using 4-bit weight quantization (e.g. AWQ or GPTQ), why does inference speed often increase even on memory-bandwidth-bound GPUs?',
    options: [
      {
        text: 'It reduces the memory transfer volume per token by up to 75%, alleviating memory bandwidth bottlenecks.',
        explanation: 'LLM autoregressive decoding is memory-bandwidth bound: reading 4-bit weights from HBM/VRAM to registers is 4x faster than FP16.',
      },
      {
        text: 'It eliminates the need for Key-Value (KV) cache storage.',
        explanation: 'Weight quantization quantizes model weights; KV caching is managed separately (or via FP8/INT8 KV cache).',
      },
      {
        text: 'It prevents out-of-distribution hallucinations during generation.',
        explanation: 'Quantization affects numerical precision and throughput, not hallucination mitigation.',
      },
      {
        text: 'It increases the floating point operations (FLOPs) performed per millisecond.',
        explanation: 'Generation latency is typically bound by memory throughput, not compute FLOPs.',
      },
    ],
    correctIndex: 0,
  },
];

export function evaluatePlacement(answers: number[]): PlacementResult {
  let score = 0;
  for (let i = 0; i < PLACEMENT_QUESTIONS.length; i++) {
    if (answers[i] === PLACEMENT_QUESTIONS[i]?.correctIndex) {
      score++;
    }
  }

  const total = PLACEMENT_QUESTIONS.length;

  if (score <= 3) {
    return {
      score,
      total,
      level: 'beginner',
      title: 'Level 1: Foundations Explorer (Learn from Scratch)',
      summary:
        'You are at the start of your journey! NeuralPath is built specifically to take you from first principles. Start with vectorized Python, intuitive matrix math, and classical ML before diving into neural architectures.',
      recommendedPathwayId: 'zero-to-hero',
      recommendedStartUrl: '/learn/foundations/01-what-is-a-model',
      recommendedModuleTitle: 'Module 1: Foundations',
    };
  }

  if (score <= 6) {
    return {
      score,
      total,
      level: 'practitioner',
      title: 'Level 2: Machine Learning Practitioner',
      summary:
        'You have solid mathematical and classical ML intuition! You understand loss landscapes, gradient descent, and activations. You are ready to dive directly into Deep Learning Core, Convolutional Networks, and Transformer architectures.',
      recommendedPathwayId: 'generative-ai-llm',
      recommendedStartUrl: '/learn/deep-learning/01-perceptron-to-mlp',
      recommendedModuleTitle: 'Module 3: Deep Learning Core',
    };
  }

  if (score <= 8) {
    return {
      score,
      total,
      level: 'practitioner',
      title: 'Level 3: Advanced Architect',
      summary:
        'Outstanding! You have strong mastery of backpropagation, attention mechanics, and fine-tuning. You are primed for Generative AI (Flow Matching, DiT), LoRA/QLoRA, RAG systems, and production MLOps.',
      recommendedPathwayId: 'generative-ai-llm',
      recommendedStartUrl: '/learn/nlp-transformers/04-self-attention',
      recommendedModuleTitle: 'Module 5: Sequence Models & Transformers',
    };
  }

  return {
    score,
    total,
    level: 'researcher',
    title: 'Level 4: Frontier AI Researcher & Engineer',
    summary:
      'Exceptional depth! You understand DPO mathematical reparameterization, causal masking nuances, and low-bit quantization memory dynamics. You are ready for frontier topics: Flow Matching, GRPO, Sparse Autoencoders (SAEs), and Capstone projects.',
    recommendedPathwayId: 'reinforcement-learning-alignment',
    recommendedStartUrl: '/learn/generative-ai/03-diffusion-flow-matching',
    recommendedModuleTitle: 'Module 6: Generative AI & Frontier Systems',
  };
}

