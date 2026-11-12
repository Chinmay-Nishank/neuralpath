import type { Metadata } from 'next';
import { PlacementClient } from '@/components/placement/placement-client';

export const metadata: Metadata = {
  title: 'Diagnostic Placement & Skill Assessment | NeuralPath',
  description:
    'Test your knowledge across math foundations, classical ML, deep learning, transformers, and modern AI alignment to find your personalized starting point.',
};

export default function PlacementPage() {
  return <PlacementClient />;
}

