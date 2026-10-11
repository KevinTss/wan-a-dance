import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Kbd } from './index.tsx';

const meta = {
  title: 'Primitives/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: { children: '⌘K' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Combination: Story = {
  render: () => (
    <span className="inline-flex gap-1">
      <Kbd>⌘</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>P</Kbd>
    </span>
  ),
};
