import type { Metadata } from 'next';
import { getAllLessons, getLessonsForModule, getLessonsForPath, getModules } from '@/lib/content';
import { LandingClient, type LandingModuleSummary, type LandingPathStats } from '@/components/home/landing-client';

export const metadata: Metadata = {
  title: 'NeuralPath — Learn Machine Learning, Deep Learning & AI',
  description:
    'Interactive Machine Learning, Deep Learning, Transformers, Generative AI, and MLOps curriculum with in-browser Python and visualizations.',
};

export default function HomePage() {
  const modules = getModules();
  const allLessons = getAllLessons();

  const moduleSummaries: LandingModuleSummary[] = modules.map((mod) => {
    const modLessons = getLessonsForModule(mod.id);
    return {
      ...mod,
      lessonCount: modLessons.length,
      firstLessonUrl: modLessons[0]?.url ?? '/curriculum',
    };
  });

  const pathConfigs: Array<{ id: 'beginner' | 'practitioner' | 'researcher'; title: string; subtitle: string }> = [
    {
      id: 'beginner',
      title: 'Beginner Path',
      subtitle: 'Start from Python, NumPy, and linear algebra intuition to build your first models and neural nets.',
    },
    {
      id: 'practitioner',
      title: 'Practitioner Path',
      subtitle: 'Focus on production classical ML, CNNs, Transformers, RAG pipelines, LoRA fine-tuning, and MLOps.',
    },
    {
      id: 'researcher',
      title: 'Researcher Path',
      subtitle: 'Dive deep into RoPE, GQA, Flow Matching, DiT, PPO, GRPO, quantization, and mechanistic interpretability.',
    },
  ];

  const paths: LandingPathStats[] = pathConfigs.map((cfg) => {
    const matching = getLessonsForPath(cfg.id);
    const totalMinutes = matching.reduce((acc, l) => acc + l.estimatedMinutes, 0);
    return {
      ...cfg,
      lessonCount: matching.length,
      estimatedHours: Math.max(1, Math.round(totalMinutes / 60)),
      startUrl: matching[0]?.url ?? '/curriculum',
    };
  });

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'NeuralPath Machine Learning, Deep Learning & AI Curriculum',
    description:
      'Complete interactive open-source course from linear algebra and classical ML to modern transformers, diffusion, RL, and MLOps.',
    provider: {
      '@type': 'Organization',
      name: 'NeuralPath',
    },
    numberOfCredits: allLessons.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <LandingClient
        modules={moduleSummaries}
        paths={paths}
        totalLessons={allLessons.length}
      />
    </>
  );
}

