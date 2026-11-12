import { describe, expect, it } from 'vitest';
import { buildGoogleSearchUrl } from '@/lib/google-search';

describe('Google Web Search helper', () => {
  it('builds encoded Google search URLs with smart ML context when needed', () => {
    const basic = buildGoogleSearchUrl('vanishing gradients', 'web', true);
    expect(basic).toBe('https://www.google.com/search?q=vanishing%20gradients%20machine%20learning');

    const alreadyContextual = buildGoogleSearchUrl('PyTorch transformer attention', 'web', true);
    expect(alreadyContextual).toBe(
      'https://www.google.com/search?q=PyTorch%20transformer%20attention'
    );
  });

  it('adds targeted site operators for arXiv, PyTorch, scikit-learn, and Papers With Code', () => {
    expect(buildGoogleSearchUrl('flash attention', 'arxiv')).toBe(
      'https://www.google.com/search?q=flash%20attention%20site%3Aarxiv.org'
    );
    expect(buildGoogleSearchUrl('Linear', 'pytorch')).toBe(
      'https://www.google.com/search?q=Linear%20site%3Apytorch.org'
    );
    expect(buildGoogleSearchUrl('StandardScaler', 'sklearn')).toBe(
      'https://www.google.com/search?q=StandardScaler%20site%3Ascikit-learn.org'
    );
    expect(buildGoogleSearchUrl('LoRA', 'paperswithcode')).toBe(
      'https://www.google.com/search?q=LoRA%20site%3Apaperswithcode.com'
    );
  });
});

