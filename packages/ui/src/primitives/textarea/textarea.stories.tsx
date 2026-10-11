import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Textarea } from './index.tsx';

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: { placeholder: 'Notes about this member', 'aria-label': 'Notes' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Read only' } };
export const Typing: Story = {
  play: async ({ canvasElement }) => {
    const textarea = within(canvasElement).getByRole('textbox', { name: 'Notes' });
    await userEvent.type(textarea, 'Prefers leading.{enter}Comes on Thursdays.');
    await expect(textarea).toHaveValue('Prefers leading.\nComes on Thursdays.');
  },
};
