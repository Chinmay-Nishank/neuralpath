import type { VizType } from '@/components/mdx/viz';

export interface PlaygroundMeta {
  slug: VizType;
  title: string;
  category: string;
  description: string;
  lessonUrl: string;
}

export const PLAYGROUNDS: PlaygroundMeta[] = [
  {
    slug: 'gradient-descent',
    title: 'Gradient Descent & 3D Loss Surface',
    category: 'Optimization',
    description: 'Compare SGD, Momentum, RMSProp, and Adam across bowls, saddles, and Rosenbrock valleys in 2D and 3D.',
    lessonUrl: '/learn/classical-ml/02-gradient-descent',
  },
  {
    slug: 'decision-boundary',
    title: 'Decision Boundary Playground',
    category: 'Classical ML',
    description: 'Switch between Logistic Regression, k-NN, RBF SVM, Decision Trees, and MLPs across non-linear 2D datasets.',
    lessonUrl: '/learn/classical-ml/07-knn-and-svm',
  },
  {
    slug: 'neural-network',
    title: 'Neural Network Playground (TensorFlow.js)',
    category: 'Deep Learning',
    description: 'Add hidden layers and neurons, pick activations, and watch live in-browser neural training bend decision boundaries.',
    lessonUrl: '/learn/deep-learning/01-perceptron-to-mlp',
  },
  {
    slug: 'backprop',
    title: 'Backpropagation Computational Graph',
    category: 'Deep Learning',
    description: 'Step through forward activations and reverse-mode chain-rule gradients on a parameterized neuron.',
    lessonUrl: '/learn/deep-learning/04-backpropagation',
  },
  {
    slug: 'convolution',
    title: '2D Convolution & Kernel Explorer',
    category: 'Computer Vision',
    description: 'Edit 3×3 filter weights or upload an image to inspect stride, zero-padding, receptive fields, and feature maps.',
    lessonUrl: '/learn/computer-vision/01-convolutions-kernels',
  },
  {
    slug: 'attention',
    title: 'Self-Attention (Q, K, V) Explorer',
    category: 'Transformers',
    description: 'Inspect scaled dot-product scores, pronoun disambiguation, temperature scaling, and GPT causal masking.',
    lessonUrl: '/learn/nlp-transformers/04-self-attention',
  },
  {
    slug: 'embeddings',
    title: '3D Embedding Space Explorer',
    category: 'NLP & Vectors',
    description: 'Toggle PCA, t-SNE, and UMAP projections, inspect cosine nearest neighbors, and test vector analogies.',
    lessonUrl: '/learn/nlp-transformers/02-word-embeddings',
  },
  {
    slug: 'tokenizer',
    title: 'BPE Tokenizer Visualizer',
    category: 'NLP & LLMs',
    description: 'Watch Byte-Pair Encoding iteratively merge frequent character pairs into subword tokens on live text.',
    lessonUrl: '/learn/nlp-transformers/01-tokenization-bpe',
  },
  {
    slug: 'bias-variance',
    title: 'Bias-Variance & Overfitting Demo',
    category: 'Generalization',
    description: 'Vary polynomial degree, sample size, noise, and Ridge L2 regularization to visualize bias² vs. variance.',
    lessonUrl: '/learn/classical-ml/04-bias-variance-regularization',
  },
  {
    slug: 'diffusion',
    title: 'Diffusion & Flow Matching Simulator',
    category: 'Generative AI',
    description: 'Compare curved DDPM cosine noise schedules against straight Rectified Flow ODE trajectories.',
    lessonUrl: '/learn/generative-ai/03-diffusion-flow-matching',
  },
  {
    slug: 'rl-gridworld',
    title: 'RL Grid-World Q-Learning Lab',
    category: 'Reinforcement Learning',
    description: 'Run episodes and observe Bellman TD Q-table updates and greedy policies emerge in real time.',
    lessonUrl: '/learn/reinforcement-learning/02-q-learning-dqn',
  },
];

