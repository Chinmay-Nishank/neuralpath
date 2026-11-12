import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const fontSans = localFont({
  src: './fonts/plus-jakarta-sans.woff2',
  variable: '--font-sans',
  display: 'optional',
  weight: '200 800',
});

const fontSerif = localFont({
  src: './fonts/newsreader.woff2',
  variable: '--font-serif',
  display: 'optional',
  weight: '200 800',
  preload: false,
});

const fontMono = localFont({
  src: './fonts/jetbrains-mono.woff2',
  variable: '--font-mono',
  display: 'optional',
  weight: '100 800',
  preload: false,
});
import { ThemeProvider } from '@/components/layout/theme-provider';
import { ProgressProvider } from '@/components/progress/progress-provider';
import { ReviewProvider } from '@/components/review/review-provider';
import { ToastProvider } from '@/components/ui/toast';
import { TopBar } from '@/components/layout/top-bar';
import { Footer } from '@/components/layout/footer';
import { ConsentBanner } from '@/components/layout/consent-banner';
import { getCardIndex } from '@/lib/cards';
import { getAllLessons } from '@/lib/content';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NeuralPath — Interactive ML, Deep Learning & AI Curriculum',
    template: '%s · NeuralPath',
  },
  description:
    'Go from "what is a model?" to training and deploying modern transformers with interactive visualizations, in-browser Python, and quizzes.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'NeuralPath',
    title: 'NeuralPath — Interactive ML, Deep Learning & AI Curriculum',
    description:
      'Master Machine Learning, Deep Learning, Transformers, Generative AI, RL, and MLOps with interactive labs and zero setup.',
    images: ['/api/og?title=NeuralPath%20Curriculum'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0E14' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const totalLessons = getAllLessons().length;
  const cardIndex = getCardIndex();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-primary antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <ProgressProvider>
            <ReviewProvider cardIndex={cardIndex}>
              <ToastProvider>
                <TopBar totalLessons={totalLessons} />
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                <Footer />
                <ConsentBanner />
              </ToastProvider>
            </ReviewProvider>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
