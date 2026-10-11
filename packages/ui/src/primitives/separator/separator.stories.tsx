import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Separator } from './index.tsx';

const meta = {
  title: 'Primitives/Separator',
  component: Separator,
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-3">
      <span>Members</span>
      <Separator />
      <span>Schedule</span>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-3">
      <span>Week</span>
      <Separator orientation="vertical" />
      <span>List</span>
    </div>
  ),
};
