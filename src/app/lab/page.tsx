import type { Metadata } from 'next';
import { AlgorithmsLabClient } from '@/components/lab/algorithms-lab-client';

export const metadata: Metadata = {
  title: 'From-Scratch ML Lab: Zero Libraries, Pure Math & Python | NeuralPath',
  description:
    'Learn and run machine learning algorithms coded completely from scratch in pure Python & NumPy: gradient descent, logistic regression, reverse-mode autograd, 2-layer MLP, Scaled Dot-Product Attention, and BPE tokenization.',
};

export default function LabPage() {
  return <AlgorithmsLabClient />;
}

