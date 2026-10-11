import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './index.tsx';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Active' },
  parameters: {
    docs: {
      description: {
        component: 'Status and metadata. Map domain states to tones, never to new colours.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Lead</Badge>
      <Badge tone="info">Trial</Badge>
      <Badge tone="success" dot>
        Active
      </Badge>
      <Badge tone="warning">Lapsed</Badge>
      <Badge tone="danger">Deactivated</Badge>
      <Badge tone="accent">Leader</Badge>
    </div>
  ),
};
