export type GoogleSearchScope = 'web' | 'arxiv' | 'pytorch' | 'sklearn' | 'paperswithcode';

export const GOOGLE_SEARCH_SCOPES: Array<{
  id: GoogleSearchScope;
  label: string;
  description: string;
}> = [
  { id: 'web', label: 'Google Web', description: 'General ML & AI web search' },
  { id: 'arxiv', label: 'arXiv Papers', description: 'Research preprints on arxiv.org' },
  { id: 'pytorch', label: 'PyTorch Docs', description: 'Official PyTorch documentation' },
  { id: 'sklearn', label: 'scikit-learn', description: 'scikit-learn API & user guide' },
  { id: 'paperswithcode', label: 'Papers With Code', description: 'Benchmarks & implementations' },
];

export function buildGoogleSearchUrl(
  query: string,
  scope: GoogleSearchScope = 'web',
  appendTopicContext = true
): string {
  const cleaned = query.trim();
  if (!cleaned) return 'https://www.google.com';

  let finalQuery = cleaned;
  if (scope === 'arxiv') {
    finalQuery = `${cleaned} site:arxiv.org`;
  } else if (scope === 'pytorch') {
    finalQuery = `${cleaned} site:pytorch.org`;
  } else if (scope === 'sklearn') {
    finalQuery = `${cleaned} site:scikit-learn.org`;
  } else if (scope === 'paperswithcode') {
    finalQuery = `${cleaned} site:paperswithcode.com`;
  } else if (
    appendTopicContext &&
    !/\b(machine learning|deep learning|neural|pytorch|scikit-learn|transformer|ml|ai)\b/i.test(
      cleaned
    )
  ) {
    finalQuery = `${cleaned} machine learning`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`;
}

