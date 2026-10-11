import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button/index.tsx';
import { Input } from '../input/index.tsx';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './index.tsx';

const meta = {
  title: 'Primitives/Dialog',
  component: DialogContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal for short, focused tasks. Focus is trapped and restored to the trigger on close.',
      },
    },
  },
  args: {
    title: 'Add member',
    description: 'They will appear in your member list.',
    closeLabel: 'Close',
  },
  render: (args) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add member</Button>
      </DialogTrigger>
      <DialogContent
        {...args}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button>Save</Button>
          </>
        }
      >
        <Input aria-label="Full name" placeholder="Full name" />
      </DialogContent>
    </Dialog>
  ),
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpenTrapAndRestoreFocus: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Add member' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Add member' });
    await expect(dialog).toHaveAccessibleDescription('They will appear in your member list.');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

export const CloseButton: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Add member' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
