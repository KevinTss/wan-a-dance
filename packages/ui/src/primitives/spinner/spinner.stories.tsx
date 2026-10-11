import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Spinner } from './index.tsx';

const meta = { title: 'Primitives/Spinner', component: Spinner, tags: ['autodocs'] } satisfies Meta<
  typeof Spinner
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-text-muted">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const Announced: Story = {
  args: { label: 'Loading members' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('status', { name: 'Loading members' }),
    ).toBeInTheDocument();
  },
};
