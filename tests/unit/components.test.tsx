import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Quiz } from '@/components/mdx/quiz';
import { Callout } from '@/components/mdx/callout';
import { Math as MathBlock } from '@/components/mdx/math';
import { Button } from '@/components/ui/button';
import { ProgressProvider } from '@/components/progress/progress-provider';

describe('Quiz component', () => {
  it('grades mcq, fill-blank, and code-completion questions with explanations', () => {
    render(
      <ProgressProvider>
        <Quiz
          lessonId="test/lesson"
          questions={[
            {
              id: 'q1',
              type: 'mcq',
              prompt: 'What does gradient point toward?',
              options: ['Steepest descent', 'Steepest ascent'],
              answer: 1,
              explanation: 'Gradient points uphill.',
            },
            {
              id: 'q2',
              type: 'fill-blank',
              prompt: 'Fill blank',
              answer: 'softmax',
              explanation: 'Normalizes logits.',
            },
            {
              id: 'q3',
              type: 'code-completion',
              prompt: 'Complete expression',
              answer: 'Q @ K.T',
              explanation: 'Dot product.',
            },
          ]}
        />
      </ProgressProvider>
    );

    fireEvent.click(screen.getByLabelText('Steepest ascent'));
    fireEvent.change(screen.getByLabelText('Your answer for question 2'), {
      target: { value: 'Softmax' },
    });
    fireEvent.change(screen.getByLabelText('Your answer for question 3'), {
      target: { value: 'Q @ K.T' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Check Answers' }));
    expect(screen.getByText('Score: 3 / 3')).toBeInTheDocument();
    expect(screen.getByText('Gradient points uphill.')).toBeInTheDocument();
  });
});

describe('Callout, Math, and Button primitives', () => {
  it('toggles collapsible math-deep-dive callout', () => {
    render(
      <Callout type="math-deep-dive" title="Derivation">
        <p>Hidden proof details</p>
      </Callout>
    );
    expect(screen.queryByText('Hidden proof details')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Derivation/i }));
    expect(screen.getByText('Hidden proof details')).toBeInTheDocument();
  });

  it('renders KaTeX accessible math role', () => {
    const { container } = render(<MathBlock tex="y = w x + b" display />);
    const mathEl = container.querySelector('[role="math"]');
    expect(mathEl).toBeInTheDocument();
    expect(mathEl?.querySelector('.katex')).toBeInTheDocument();
  });

  it('disables Button when loading', () => {
    render(<Button loading>Running</Button>);
    expect(screen.getByRole('button', { name: 'Running' })).toBeDisabled();
  });
});
