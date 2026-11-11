'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { VizSkeleton } from '@/components/ui/skeleton';

const GradientDescentViz = dynamic(
  () => import('@/components/viz/gradient-descent-viz').then((m) => m.GradientDescentViz),
  { loading: () => <VizSkeleton height={380} /> }
);
const DecisionBoundaryViz = dynamic(
  () => import('@/components/viz/decision-boundary-viz').then((m) => m.DecisionBoundaryViz),
  { loading: () => <VizSkeleton height={360} /> }
);
const NeuralNetworkPlaygroundViz = dynamic(
  () =>
    import('@/components/viz/neural-network-playground-viz').then(
      (m) => m.NeuralNetworkPlaygroundViz
    ),
  { ssr: false, loading: () => <VizSkeleton height={380} /> }
);
const BackpropGraphViz = dynamic(
  () => import('@/components/viz/backprop-graph-viz').then((m) => m.BackpropGraphViz),
  { loading: () => <VizSkeleton height={340} /> }
);
const ConvolutionExplorerViz = dynamic(
  () =>
    import('@/components/viz/convolution-explorer-viz').then((m) => m.ConvolutionExplorerViz),
  { ssr: false, loading: () => <VizSkeleton height={380} /> }
);
const AttentionExplorerViz = dynamic(
  () => import('@/components/viz/attention-explorer-viz').then((m) => m.AttentionExplorerViz),
  { loading: () => <VizSkeleton height={380} /> }
);
const EmbeddingSpaceViz = dynamic(
  () => import('@/components/viz/embedding-space-viz').then((m) => m.EmbeddingSpaceViz),
  { ssr: false, loading: () => <VizSkeleton height={380} /> }
);
const TokenizerViz = dynamic(
  () => import('@/components/viz/tokenizer-viz').then((m) => m.TokenizerViz),
  { loading: () => <VizSkeleton height={340} /> }
);
const BiasVarianceViz = dynamic(
  () => import('@/components/viz/bias-variance-viz').then((m) => m.BiasVarianceViz),
  { loading: () => <VizSkeleton height={360} /> }
);
const DiffusionProcessViz = dynamic(
  () => import('@/components/viz/diffusion-process-viz').then((m) => m.DiffusionProcessViz),
  { loading: () => <VizSkeleton height={360} /> }
);
const RlGridworldViz = dynamic(
  () => import('@/components/viz/rl-gridworld-viz').then((m) => m.RlGridworldViz),
  { ssr: false, loading: () => <VizSkeleton height={380} /> }
);
const MathChartViz = dynamic(
  () => import('@/components/viz/math-chart-viz').then((m) => m.MathChartViz),
  { loading: () => <VizSkeleton height={320} /> }
);

export type VizType =
  | 'gradient-descent'
  | 'decision-boundary'
  | 'neural-network'
  | 'backprop'
  | 'convolution'
  | 'attention'
  | 'embeddings'
  | 'tokenizer'
  | 'bias-variance'
  | 'diffusion'
  | 'rl-gridworld'
  | 'linear-algebra'
  | 'probability'
  | 'activations'
  | 'roc-pr'
  | 'quantization'
  | 'shap'
  | 'rag';

class VizErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackTitle: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackTitle: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-6 rounded-md border border-hairline bg-subtle p-5 text-sm text-primary-secondary">
          <p className="font-semibold text-primary">{this.props.fallbackTitle}</p>
          <p className="mt-1">
            Interactive canvas could not initialize in this browser context. Review the equations
            and runnable Python code below.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Viz({
  type,
  preset,
}: {
  type: VizType;
  preset?: string;
}) {
  const renderViz = () => {
    switch (type) {
      case 'gradient-descent':
        return (
          <GradientDescentViz
            preset={
              (preset as 'bowl' | 'saddle' | 'nonconvex' | 'rosenbrock' | undefined) ?? 'bowl'
            }
          />
        );
      case 'decision-boundary':
        return (
          <DecisionBoundaryViz
            defaultModel={
              (preset as 'logistic' | 'knn' | 'rbf-svm' | 'tree' | 'mlp' | undefined) ?? 'rbf-svm'
            }
          />
        );
      case 'neural-network':
        return <NeuralNetworkPlaygroundViz />;
      case 'backprop':
        return <BackpropGraphViz />;
      case 'convolution':
        return <ConvolutionExplorerViz />;
      case 'attention':
        return (
          <AttentionExplorerViz
            defaultPreset={
              (preset as 'pronoun-tired' | 'pronoun-wide' | 'causal-code' | undefined) ??
              'pronoun-tired'
            }
          />
        );
      case 'embeddings':
        return <EmbeddingSpaceViz />;
      case 'tokenizer':
        return <TokenizerViz />;
      case 'bias-variance':
        return <BiasVarianceViz />;
      case 'diffusion':
        return <DiffusionProcessViz />;
      case 'rl-gridworld':
        return <RlGridworldViz />;
      case 'linear-algebra':
      case 'probability':
      case 'activations':
      case 'roc-pr':
      case 'quantization':
      case 'shap':
      case 'rag':
        return <MathChartViz preset={type} />;
      default:
        return <MathChartViz preset="activations" />;
    }
  };

  return (
    <VizErrorBoundary fallbackTitle={`Interactive Visualization (${type})`}>
      {renderViz()}
    </VizErrorBoundary>
  );
}

