import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Button, IconButton } from './button';
import { Badge } from './badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Input } from './input';
import { Slider } from './slider';
import { Toggle } from './toggle';
import { ProgressBar, ProgressRing } from './progress';
import { Breadcrumbs } from './breadcrumbs';
import { Kbd } from './kbd';
import { DataTable } from './table';
import { Skeleton, VizSkeleton } from './skeleton';

const meta: Meta = {
  title: 'Design System/Core Components',
  tags: ['autodocs'],
};

export default meta;

export const ButtonsAndBadges: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary">Primary Action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <IconButton label="Ask Tutor" variant="outline">
          <Sparkles className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">Beginner</Badge>
        <Badge variant="accent">Active Path</Badge>
        <Badge variant="success">
          <CheckCircle2 className="h-3 w-3" /> Passed
        </Badge>
        <Badge variant="warning">High Variance</Badge>
        <Badge variant="danger">Diverged</Badge>
        <Badge variant="info">Static Fallback</Badge>
        <Kbd>Ctrl+K</Kbd>
      </div>
    </div>
  ),
};

export const InputsAndControls: StoryObj = {
  render: () => (
    <div className="grid max-w-xl gap-5">
      <Input label="Email Address" placeholder="you@domain.com" hint="Used only for curriculum updates." />
      <Input label="Validation Error State" defaultValue="bad-email" error="Please enter a valid email address." />
      <Slider label="Learning Rate (η)" value={0.14} min={0.01} max={0.5} step={0.01} onValueChange={() => {}} />
      <Toggle
        label="Causal Masking"
        description="Prevent future tokens from attending backward"
        checked={true}
        onCheckedChange={() => {}}
      />
    </div>
  ),
};

export const CardsProgressAndTables: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Curriculum', href: '/curriculum' },
          { label: 'Classical ML', href: '/curriculum?module=classical-ml' },
          { label: 'Gradient Descent' },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module 02 · Classical ML</CardTitle>
            <CardDescription>10 interactive lessons · 6 hours</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <ProgressBar value={70} label="Completion" showPercent className="w-44" />
            <ProgressRing value={70} />
          </CardContent>
        </Card>
        <DataTable
          caption="Optimizer summary"
          headers={['Optimizer', 'Steps', 'Loss']}
          rows={[
            ['SGD', 30, '0.1421'],
            ['Momentum', 30, '0.0048'],
            ['Adam', 30, '0.0012'],
          ]}
        />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <VizSkeleton height={240} />
      </div>
    </div>
  ),
};

