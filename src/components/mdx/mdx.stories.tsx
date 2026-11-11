import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Callout } from './callout';
import { KeyTakeaways } from './key-takeaways';
import { Math } from './math';
import { Quiz } from './quiz';

const meta: Meta = {
  title: 'MDX Lesson Components/Pedagogical Blocks',
  tags: ['autodocs'],
};

export default meta;

export const CalloutsAndMath: StoryObj = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <Callout type="note" title="Intuition Check">
        Parameters are learned from data; hyperparameters govern the learning procedure.
      </Callout>
      <Callout type="tip" title="Production Tip">
        Always fit StandardScaler strictly on the training split to prevent data leakage.
      </Callout>
      <Callout type="warning" title="Divergence Hazard">
        Learning rates above 2/L_max overshoot parabolic valley walls.
      </Callout>
      <Callout type="math-deep-dive" title="Scaled Dot-Product Attention">
        <Math tex="\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V" display />
      </Callout>
      <KeyTakeaways
        items={[
          'Gradients point uphill; subtracting η∇L moves downhill.',
          'Self-attention links any pair of tokens in O(1) sequential operations.',
        ]}
      />
    </div>
  ),
};

export const InteractiveQuiz: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <Quiz
        questions={[
          {
            id: 'story-q1',
            type: 'mcq',
            prompt: 'Why divide QK^T by sqrt(d_k)?',
            options: [
              'To enforce causality',
              'To keep dot-product variance near 1 so softmax does not saturate',
              'To replace LayerNorm',
            ],
            answer: 1,
            explanation: 'Dot products scale in variance with d_k; dividing by sqrt(d_k) keeps softmax gradients healthy.',
          },
          {
            id: 'story-q2',
            type: 'fill-blank',
            prompt: 'Masked logits in causal attention are set to ______ before softmax.',
            answer: '-inf',
            explanation: 'Negative infinity ensures exp(-inf) = 0 after softmax.',
          },
        ]}
      />
    </div>
  ),
};

