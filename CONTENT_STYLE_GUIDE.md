# NeuralPath Content & Pedagogical Style Guide

1. **Intuition First:** Open every lesson with a concrete problem or failure mode before introducing equations.
2. **Progressive Disclosure:** Put algebraic derivations inside `<Callout type="math-deep-dive">` so beginners keep momentum while researchers get exact math.
3. **Color-Blind-Safe Visuals & Accessible Descriptions:** Pair every visualization with a one-line *"What to notice"* caption and never communicate status by color alone.
4. **Testable Self-Contained Code:** Every `<CodeRunner>` block must run cleanly against bundled datasets in `/datasets/` or synthetic data with fixed seeds (`rng = np.random.default_rng(42)`). Avoid network downloads inside Pyodide examples.
5. **Active Recall Quizzes:** Include at least 2 questions mixing conceptual understanding (`mcq`), terminology (`fill-blank`), and tensor/API syntax (`code-completion`), each with an explanatory feedback note.
6. **Plain, Direct Microcopy:** Keep explanations crisp and free of filler phrases or exaggerated hype.

