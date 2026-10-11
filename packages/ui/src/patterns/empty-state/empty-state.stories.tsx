import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Users } from 'lucide-react';
import { expect, within } from 'storybook/test';
import { Button } from '../../primitives/button/index.tsx';
import { EmptyState } from './index.tsx';

const meta = {
  title: 'Patterns/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    icon: <Users />,
    title: 'No members yet',
    description: 'Add your first student to start taking attendance.',
    action: <Button>Add member</Button>,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'No members yet' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Add member' })).toBeInTheDocument();
  },
};
export const Minimal: Story = {
  args: { icon: undefined, description: undefined, action: undefined },
};
