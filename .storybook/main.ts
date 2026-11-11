import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  viteFinal: async (cfg) => {
    if (cfg.resolve) {
      cfg.resolve.alias = {
        ...cfg.resolve.alias,
        '@': path.resolve(currentDir, '../src'),
        '@velite': path.resolve(currentDir, '../.velite'),
      };
    }
    return cfg;
  },
};

export default config;
