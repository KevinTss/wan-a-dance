import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '../../primitives/badge/index.tsx';
import { Inline, Stack } from './index.tsx';

const meta = { title: 'Layout/Stack', component: Stack, tags: ['autodocs'] } satisfies Meta<
  typeof Stack
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = {
  render: () => (
    <Stack gap={2}>
      <Badge>One</Badge>
      <Badge>Two</Badge>
      <Badge>Three</Badge>
    </Stack>
  ),
};

export const Row: Story = {
  render: () => (
    <Inline>
      <Badge>One</Badge>
      <Badge>Two</Badge>
    </Inline>
  ),
};
