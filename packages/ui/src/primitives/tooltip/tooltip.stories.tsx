import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button/index.tsx';
import { Tooltip, TooltipProvider } from './index.tsx';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="p-12">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  args: {
    content: 'Search',
    shortcut: '⌘K',
    children: <Button variant="secondary">Hover me</Button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnFocus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button')).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent('Search'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  },
};
