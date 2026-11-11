import * as React from 'react';
import * as runtime from 'react/jsx-runtime';
import { Callout } from './callout';
import { CodeRunner } from './code-runner';
import { GlossaryTerm } from './glossary-term';
import { KeyTakeaways } from './key-takeaways';
import { Math } from './math';
import { Quiz } from './quiz';
import { Viz } from './viz';

const mdxComponents = {
  Viz,
  CodeRunner,
  Quiz,
  Callout,
  Math,
  GlossaryTerm,
  KeyTakeaways,
};

function compileMdxComponent(code: string) {
  const fn = new Function(code);
  const mod = fn({ ...runtime });
  return mod.default as React.ComponentType<{ components?: Record<string, unknown> }>;
}

export function MdxContent({ code }: { code: string }) {
  const Component = compileMdxComponent(code);
  return <Component components={mdxComponents} />;
}
