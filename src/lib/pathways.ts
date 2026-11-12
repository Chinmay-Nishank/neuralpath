export interface LearningPathway {
  id: string;
  title: string;
  shortTitle: string;
  tagline: string;
  level: 'beginner' | 'practitioner' | 'researcher' | 'all';
  levelLabel: string;
  estimatedHours: number;
  modules: string[];
  outcomes: string[];
  startUrl: string;
  colorVar: string;
}

export const LEARNING_PATHWAYS: LearningPathway[] = [
  {
    id: 'zero-to-hero',
    title: 'Zero to Hero: Complete AI Mastery (From Scratch to Modern Frontier)',
    shortTitle: 'Zero to Hero (From Scratch)',
    tagline: 'Start from absolute foundations and progress step-by-step through Classical ML, Deep Learning, Transformers, GenAI, and Capstones.',
    level: 'all',
    levelLabel: 'From Scratch to Advanced',
    estimatedHours: 54,
    modules: [
      'foundations',
      'classical-ml',
      'deep-learning',
      'computer-vision',
      'nlp-transformers',
      'generative-ai',
      'reinforcement-learning',
      'mlops',
      'ai-safety',
      'capstones',
    ],
    outcomes: [
      'Derive linear algebra, calculus, and probability intuition from first principles',
      'Code loss functions, gradient descent, and multi-layer perceptrons from scratch',
      'Build and train CNNs, ResNets, and Vision Transformers',
      'Understand BPE tokenization, Scaled Dot-Product Attention, RoPE, and GQA',
      'Implement RAG pipelines, LoRA fine-tuning, Flow Matching DiT, and RLHF/DPO',
      'Complete 5 production-grade Capstone engineering projects',
    ],
    startUrl: '/learn/foundations/01-what-is-a-model',
    colorVar: 'var(--chart-1)',
  },
  {
    id: 'generative-ai-llm',
    title: 'Generative AI & LLM Systems Specialist',
    shortTitle: 'LLMs & Generative AI',
    tagline: 'Deep dive into modern language models, attention mechanisms, LoRA/QLoRA, RAG pipelines, and agentic protocols.',
    level: 'practitioner',
    levelLabel: 'Intermediate to Advanced',
    estimatedHours: 24,
    modules: [
      'foundations',
      'deep-learning',
      'nlp-transformers',
      'generative-ai',
      'capstones',
    ],
    outcomes: [
      'Master Scaled Dot-Product Attention, Causal Masking, and Transformer Decoders',
      'Fine-tune open-weights LLMs using LoRA/QLoRA parameter-efficient adaptation',
      'Build production RAG with dense vector embeddings and re-ranking',
      'Understand modern Flow Matching (DiT) vs. Diffusion trajectories',
      'Construct autonomous Model Context Protocol (MCP) tool-calling agents',
    ],
    startUrl: '/learn/nlp-transformers/04-self-attention',
    colorVar: 'var(--chart-5)',
  },
  {
    id: 'computer-vision-multimodal',
    title: 'Computer Vision & Visual Perception Engineer',
    shortTitle: 'Computer Vision',
    tagline: 'From 2D spatial convolution kernels and Residual Networks to Vision Transformers (ViT) and Multimodal Embeddings.',
    level: 'practitioner',
    levelLabel: 'Scratch to Practitioner',
    estimatedHours: 18,
    modules: [
      'foundations',
      'classical-ml',
      'deep-learning',
      'computer-vision',
      'capstones',
    ],
    outcomes: [
      'Implement 2D convolution, zero-padding, stride, and pooling filters from scratch',
      'Overcome vanishing gradients with Residual skip connections (ResNet-50)',
      'Tokenize 16x16 image patches for Vision Transformers (ViT)',
      'Deploy transfer learning and data augmentation pipelines',
      'Build end-to-end multi-class image classification and feature extractors',
    ],
    startUrl: '/learn/computer-vision/01-convolutions-kernels',
    colorVar: 'var(--chart-4)',
  },
  {
    id: 'reinforcement-learning-alignment',
    title: 'Reinforcement Learning & Post-Training Alignment',
    shortTitle: 'RL & AI Alignment',
    tagline: 'Master Markov Decision Processes, Bellman optimality, PPO, DPO, GRPO, and Mechanistic Interpretability.',
    level: 'researcher',
    levelLabel: 'Advanced Researcher',
    estimatedHours: 20,
    modules: [
      'foundations',
      'deep-learning',
      'reinforcement-learning',
      'ai-safety',
      'capstones',
    ],
    outcomes: [
      'Formulate MDPs and solve Bellman expectation & optimality equations',
      'Implement Tabular Q-Learning, Deep Q-Networks (DQN), and PPO actor-critic',
      'Direct Preference Optimization (DPO) and Group Relative Policy Optimization (GRPO)',
      'Inspect Sparse Autoencoders (SAEs) and mechanistic neural features',
      'Audit model safety, bias, prompt injection resistance, and fairness metrics',
    ],
    startUrl: '/learn/reinforcement-learning/01-mdps-bellman',
    colorVar: 'var(--chart-2)',
  },
  {
    id: 'mlops-production',
    title: 'MLOps, Quantization & Production Inference',
    shortTitle: 'MLOps & Deployment',
    tagline: 'Bridge research models into high-performance, resilient, and monitored production serving architectures.',
    level: 'practitioner',
    levelLabel: 'Production Systems',
    estimatedHours: 16,
    modules: [
      'foundations',
      'classical-ml',
      'deep-learning',
      'mlops',
      'capstones',
    ],
    outcomes: [
      'Export and optimize PyTorch models into ONNX runtimes',
      'Quantize LLMs to INT8 / INT4 using AWQ and GPTQ with minimal perplexity loss',
      'Deploy high-throughput inference servers with continuous batching & vLLM',
      'Instrument drift detection, data validation, and automated CI/CD eval gates',
      'Run end-to-end containerized deployments with Docker and health observability',
    ],
    startUrl: '/learn/mlops/01-experiment-tracking',
    colorVar: 'var(--chart-3)',
  },
];

export function getPathwayById(id: string): LearningPathway | undefined {
  return LEARNING_PATHWAYS.find((p) => p.id === id);
}

export function calculatePathwayProgress(
  pathway: LearningPathway,
  completedLessons: Record<string, unknown>,
  lessonsInPath: Array<{ routeId: string; module: string }>
): { completed: number; total: number; percent: number; nextLessonRouteId?: string } {
  const filtered = lessonsInPath.filter((l) => pathway.modules.includes(l.module));
  const total = filtered.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };

  let completed = 0;
  let nextLessonRouteId: string | undefined;

  for (const l of filtered) {
    if (completedLessons[l.routeId]) {
      completed++;
    } else if (!nextLessonRouteId) {
      nextLessonRouteId = l.routeId;
    }
  }

  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent, nextLessonRouteId };
}

