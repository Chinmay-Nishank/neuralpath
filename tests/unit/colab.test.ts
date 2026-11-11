import { describe, expect, it } from 'vitest';
import { buildIpynbPayload, getColabUrl } from '@/lib/colab';

describe('Colab helper utilities', () => {
  it('builds valid nbformat v4 ipynb JSON', () => {
    const raw = buildIpynbPayload('Self-Attention', 'import torch\nprint(torch.__version__)');
    const parsed = JSON.parse(raw);
    expect(parsed.nbformat).toBe(4);
    expect(parsed.cells).toHaveLength(2);
    expect(parsed.cells[1].cell_type).toBe('code');
  });

  it('builds clean Colab GitHub launch URLs', () => {
    const url = getColabUrl('notebooks/nlp-transformers/self-attention.ipynb');
    expect(url).toContain('https://colab.research.google.com/github/');
    expect(url).toContain('notebooks/nlp-transformers/self-attention.ipynb');
  });
});

