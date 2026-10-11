import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Avatar, initials } from './index.tsx';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { name: 'Ana Martínez' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('AM')).toBeInTheDocument();
    await expect(initials('  cher ')).toBe('C');
    await expect(initials('')).toBe('?');
    await expect(initials('Jean Paul Gaultier')).toBe('JG');
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Ana Martínez" size="sm" />
      <Avatar name="Ana Martínez" size="md" />
      <Avatar name="Ana Martínez" size="lg" />
    </div>
  ),
};
