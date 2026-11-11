import type { Preview } from '@storybook/nextjs-vite';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/jetbrains-mono';
import 'katex/dist/katex.min.css';
import '../src/app/globals.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'NeuralPath design system color theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      return (
        <div
          className={`${theme} bg-canvas p-6 text-primary min-h-[200px] font-sans`}
          style={
            {
              '--font-sans': "'Plus Jakarta Sans Variable', system-ui, sans-serif",
              '--font-serif': "'Newsreader Variable', Georgia, serif",
              '--font-mono': "'JetBrains Mono Variable', ui-monospace, monospace",
            } as React.CSSProperties
          }
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;

