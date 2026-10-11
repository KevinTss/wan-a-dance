import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../button/index.tsx';
import { Toaster, toast } from './index.tsx';

const meta = {
  title: 'Primitives/Toast',
  component: Toaster,
  tags: ['autodocs'],
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.success('Member added', { description: 'Ana Martínez is now in your list.' })
        }
      >
        Add
      </Button>
    </>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Add' }));
    await expect(await screen.findByText('Member added')).toBeInTheDocument();
  },
};
